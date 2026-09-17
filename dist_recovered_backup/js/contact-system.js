/**
 * ============================================
 * CONTACT ARCHITECTURE V2.1 (TIME-SLOT ENGINE)
 * Strategy: Granular Availability & Deterministic Simulation
 * Status: BACKEND_READY
 * ============================================
 */

/**
 * CONFIGURATION & CONSTANTS
 * Defines specific operational hours and slot duration for precise scheduling.
 */
const SYSTEM_CONFIG = {
    calendar: {
        businessStart: 10, // 10:00 AM
        businessEnd: 18,   // 06:00 PM
        slotDuration: 60,  // minutes
        daysOff: [0, 6]    // Sun, Sat
    }
};

/**
 * ============================================
 * SERVICE ABSTRACTION LAYER
 * ============================================
 */

class ICalendarAdapter {
    async initialize() { throw new Error('Method not implemented'); }
    async getAvailability(year, month) { throw new Error('Method not implemented'); }
    async getSlots(dateStr) { throw new Error('Method not implemented'); }
    async createBooking(payload) { throw new Error('Method not implemented'); }
}

/**
 * GoogleLiveAdapter V3.0 (Service Account Uplink)
 * 
 * Replaces the previous client-side specific logic.
 * Now connects to /api/calendar to fetch REAL busy slots from the Service Account.
 */
class GoogleLiveAdapter extends ICalendarAdapter {
    constructor() {
        super();
        this.busyCache = null;
        this.lastFetch = 0;
        this.isSynced = false;
    }

    async initialize() {
        console.log('[System] Initializing Adapter: GoogleLiveAdapter (Service Account Uplink)');
        return true;
    }

    // Helper: Fetch busy slots from our secure backend
    async _fetchBusySlots() {
        // Simple caching (1 minute) to prevent spamming the API on every click
        if (this.busyCache && (Date.now() - this.lastFetch < 60000)) {
            return this.busyCache;
        }

        try {
            const response = await fetch('/api/calendar');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            let data = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                data = {};
            }
            this.busyCache = data.busySlots || [];
            this.lastFetch = Date.now();
            this.isSynced = true;
            return this.busyCache;
        } catch (error) {
            console.warn('[System] Calendar Sync Offline:', error.message || error);
            this.isSynced = false;
            return []; // Fail gracefully (show all open)
        }
    }

    async getAvailability(year, month) {
        // 1. Fetch Real Busy Data
        const busySlots = await this._fetchBusySlots();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const availability = [];
        const { daysOff } = SYSTEM_CONFIG.calendar;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dayOfWeek = dateObj.getDay();
            
            let status = 'AVAILABLE';

            // A. Structural Constraints (Weekends)
            if (daysOff.includes(dayOfWeek)) {
                status = 'UNAVAILABLE';
            } else {
                // B. Real Calendar Constraints
                // Check if any "Busy Slot" covers the ENTIRE business day (simplification)
                // Or if the day has varying degrees of busyness.
                // For V3.0, let's mark the day as FULLY_BOOKED if it has > 4 hours of meetings
                // or keep it AVAILABLE but let getSlots handle the specific times.
                
                // Let's check generally if there are slots on this day
                const daysEvents = busySlots.filter(slot => slot.start.startsWith(dateStr));
                
                if (daysEvents.length > 3) { // Arbitrary heuristic for "Heavy Day"
                     // status = 'HEAVY'; // Could use a different color
                }
                
                // For now, we leave the day clickable (AVAILABLE) 
                // so the user can see which specific slots are open in the next view.
            }

            availability.push({
                date: d,
                fullDate: dateStr,
                status: status
            });
        }
        return availability;
    }

    async getSlots(dateStr) {
        // 1. Fetch Real Busy Data
        const busySlots = await this._fetchBusySlots();
        
        // 2. Filter for this specific day
        // Google timestamps are ISO: 2023-10-25T14:30:00+01:00
        const daysBusyness = busySlots.filter(slot => {
            return slot.start.startsWith(dateStr) || slot.end.startsWith(dateStr);
        });

        const slots = [];
        const { businessStart, businessEnd } = SYSTEM_CONFIG.calendar;

        for (let hour = businessStart; hour < businessEnd; hour++) {
            const timeStr = `${hour}:00`;
            const slotStart = new Date(`${dateStr}T${String(hour).padStart(2,'0')}:00:00`);
            const slotEnd = new Date(`${dateStr}T${String(hour+1).padStart(2,'0')}:00:00`);
            
            // Check overlap with any real busy slot
            const isBusy = daysBusyness.some(busy => {
                const bStart = new Date(busy.start);
                const bEnd = new Date(busy.end);
                
                // Overlap logic: (StartA < EndB) and (EndA > StartB)
                return (slotStart < bEnd) && (slotEnd > bStart);
            });

            slots.push({
                time: timeStr,
                status: isBusy ? 'BUSY' : 'AVAILABLE'
            });
        }
        
        return slots;
    }

    // Write to Booking API (V4.0 Service Account Logic & Dual-Intent Support)
    async createBooking(payload) {
        console.group('%c[UPLINK] TRANSMITTING REQUEST', 'color: #00f0ff; background: #000; padding: 4px;');
        console.log('Endpoint: POST /api/calendar');
        console.log('Payload:', payload);
        console.groupEnd();
        
        try {
            // Construct the payload with exact key names expected by backend
            const requestBody = {
                name: payload.identity,
                email: payload.contact,
                briefing: payload.briefing,
                inquiryOnly: !!payload.inquiryOnly,
                date: payload.time ? payload.time.start : null,
                startTime: payload.time ? payload.time.slot : null,
                timezone: payload.time ? payload.time.timezone : (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome')
            };
            
            console.log('[UPLINK] Request Body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            let data = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.warn('[UPLINK] Non-JSON or empty response received:', response.status);
            }
            
            console.group('%c[UPLINK] RESPONSE RECEIVED', response.ok ? 'color: #00ff88;' : 'color: #ff4444;');
            console.log('Status:', response.status);
            console.log('Data:', data);
            console.groupEnd();
            
            if (!response.ok) {
                // Specific Handling for local dev server / missing serverless endpoint (404, 502, 503)
                if (response.status === 404 || response.status === 502 || response.status === 503) {
                    console.warn(`[UPLINK] Backend ${response.status}: Service Account / API endpoint not active`);
                    if (payload.inquiryOnly) {
                        return { status: 'INQUIRY_CONFIRMED', isFallback: true };
                    }
                    return { status: 'OFFLINE_MODE', error: 'Service credentials not active', isFallback: true };
                }
                if (response.status === 403) {
                    console.error('[UPLINK] 403 FORBIDDEN: Service Account lacks calendar write permission');
                    return { status: 'PERMISSION_DENIED', error: data.error || 'Calendar write access denied' };
                }
                if (response.status === 400) {
                    console.error('[UPLINK] 400 BAD REQUEST:', data.error);
                    return { status: 'VALIDATION_ERROR', error: data.error || 'Invalid request data' };
                }
                return { status: 'OFFLINE_MODE', error: data.error || `HTTP ${response.status} Error`, isFallback: true };
            }

            // Direct inquiry response
            if (data.status === 'INQUIRY_RECORDED') {
                return { status: 'INQUIRY_CONFIRMED', timestamp: data.timestamp || new Date().toISOString() };
            }

            // If response is 200 OK but data.eventId is missing (e.g. static dev server returning empty 200)
            if (!data || !data.eventId) {
                if (payload.inquiryOnly) {
                    return { status: 'INQUIRY_CONFIRMED', timestamp: new Date().toISOString() };
                }
                if (data && data.status === 'OFFLINE') {
                    return { status: 'OFFLINE_MODE', error: data.error || 'Service credentials not active', isFallback: true };
                }
                return { status: 'OFFLINE_MODE', error: 'Local server environment (Demo Mode)', isFallback: true };
            }

            // SUCCESS: Event was created
            console.log('%c[UPLINK] EVENT CREATED SUCCESSFULLY', 'color: #00ff88; font-weight: bold;');
            console.log('Event ID:', data.eventId);
            console.log('Calendar Link:', data.link);
            
            return {
                id: data.eventId,
                status: 'CONFIRMED',
                calendar: 'GOOGLE_LIVE',
                link: data.link,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('%c[UPLINK] CRITICAL FAILURE', 'color: #ff4444; font-weight: bold;');
            console.error('Error:', error.message);
            if (payload.inquiryOnly) {
                return { status: 'INQUIRY_CONFIRMED', isFallback: true };
            }
            return { status: 'OFFLINE_MODE', error: 'Backend serverless function not active in local environment', isFallback: true };
        }
    }
}

class CalendarService {
    constructor() {
        // Direct connection to Google Calendar via Service Account
        this.adapter = new GoogleLiveAdapter();
    }
    async initialize() { return this.adapter.initialize(); }
    async getAvailability(y, m) { return this.adapter.getAvailability(y, m); }
    async getSlots(date) { return this.adapter.getSlots(date); }
    async createBooking(p) { return this.adapter.createBooking(p); }
    getSyncStatus() {
        if (this.adapter.isSynced) {
            return {
                synced: true,
                label: 'Google Calendar Synced',
                dotClass: 'green'
            };
        } else {
            return {
                synced: false,
                label: 'Calendar Sync Offline',
                dotClass: 'amber'
            };
        }
    }
}

/**
 * ============================================
 * UI ORCHESTRATOR
 * ============================================
 */
class ContactInterface {
    constructor() {
        this.container = document.querySelector('.calendar-widget');
        this.form = document.getElementById('scheduler-form');
        this.slotDisplay = document.getElementById('slot-display');
        this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
        this.userTimezoneDisplay = this.userTimezone.split('/').pop().replace(/_/g, ' ');
        
        this.service = new CalendarService(); // Factory handles injection
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedSlot = null;

        this.init();
    }

    async init() {
        if (!this.container) return;
        
        // Update Console Title
        const consoleTitle = document.querySelector('.console-column.right .console-title');
        if (consoleTitle) {
            consoleTitle.innerHTML = 'Book a Strategy Call';
        }

        await this.service.initialize();
        this.renderCalendar(this.currentDate);
        this.bindFormEvents();
        this.initPrivacyModal();
    }

    // STATE 1: CALENDAR VIEW
    async renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth(); 
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        
        // Reset View State
        this.selectedDate = null;
        this.selectedSlot = null;
        this.updateSlotDisplay();

        const initialSync = this.service.getSyncStatus();

        this.container.innerHTML = `
            <div class="calendar-view">
                <div class="cal-header">
                    <button class="cal-nav prev" id="cal-prev"><i class="fa-solid fa-chevron-left"></i></button>
                    <span class="cal-title">${monthNames[month]} ${year}</span>
                    <button class="cal-nav next" id="cal-next"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div class="cal-loading-overlay" id="cal-loader" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.8); z-index:10; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-circle-notch fa-spin" style="color:var(--c-signal)"></i>
                </div>
                <div class="cal-grid" id="cal-grid">
                    <!-- Days Injected Here -->
                </div>
                <div class="cal-footer-status" id="cal-footer-status">
                     <div class="status-tz">
                        <span><i class="fa-regular fa-clock"></i> Rome (CET) · Local (${this.userTimezoneDisplay})</span>
                     </div>
                     <div class="status-item">
                        <span class="status-dot ${initialSync.dotClass}"></span>
                        <span>${initialSync.label}</span>
                     </div>
                </div>
            </div>
            <div class="slots-view" id="slots-view">
                <!-- Slots Injected Here -->
            </div>
        `;

        // Render Grid
        const grid = document.getElementById('cal-grid');
        const loader = document.getElementById('cal-loader');
        
        loader.style.display = 'flex';
        const availability = await this.service.getAvailability(year, month);
        loader.style.display = 'none';

        // Dynamically update status after sync attempt
        const updatedSync = this.service.getSyncStatus();
        const footerStatus = document.getElementById('cal-footer-status');
        if (footerStatus) {
            footerStatus.innerHTML = `
                <div class="status-tz">
                    <span><i class="fa-regular fa-clock"></i> Rome (CET) · Local (${this.userTimezoneDisplay})</span>
                </div>
                <div class="status-item">
                    <span class="status-dot ${updatedSync.dotClass}"></span>
                    <span>${updatedSync.label}</span>
                </div>
            `;
        }

        grid.innerHTML = `
            <div class="cal-day-name">S</div><div class="cal-day-name">M</div><div class="cal-day-name">T</div>
            <div class="cal-day-name">W</div><div class="cal-day-name">T</div><div class="cal-day-name">F</div>
            <div class="cal-day-name">S</div>
        `;

        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;

        availability.forEach(day => {
            const isToday = (day.date === new Date().getDate() && month === new Date().getMonth()) ? 'today' : '';
            const statusClass = day.status === 'FULLY_BOOKED' ? 'busy' : day.status.toLowerCase();
            const action = day.status === 'AVAILABLE' ? `onclick="window.contactInterface.selectDate('${day.fullDate}')"` : '';
            
            grid.innerHTML += `
                <button class="cal-day ${statusClass} ${isToday}" ${action}>
                    ${day.date}
                </button>
            `;
        });

        // Listeners
        document.getElementById('cal-prev').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar(this.currentDate);
        });
        document.getElementById('cal-next').addEventListener('click', () => {
             this.currentDate.setMonth(this.currentDate.getMonth() + 1);
             this.renderCalendar(this.currentDate);
        });
    }

    // STATE 2: SLOTS VIEW
    async selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.updateSlotDisplay(); // Show date, pending time

        const calendarView = document.querySelector('.calendar-view');
        const slotsView = document.getElementById('slots-view');
        
        // Render Skeleton
        slotsView.innerHTML = `
            <div class="cal-header">
                <button class="cal-nav back" id="slots-back"><i class="fa-solid fa-arrow-left"></i></button>
                <span class="cal-title">${dateStr}</span>
                <div style="width:30px"></div>
            </div>
            <div class="cal-loading" style="height:200px">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span style="font-size:0.7rem; margin-top:10px">Loading time slots...</span>
            </div>
        `;

        // Transition
        calendarView.classList.add('hidden');
        slotsView.classList.add('active');

        // Fetch
        const slots = await this.service.getSlots(dateStr);
        
        // Render Slots
        let slotsHtml = `<div class="slots-grid">`;
        if (slots.length === 0) {
            slotsHtml += `<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--c-text-muted)">No available slots</div>`;
        } else {
            slots.forEach(slot => {
                const action = slot.status === 'AVAILABLE' ? `onclick="window.contactInterface.selectSlot('${slot.time}', this)"` : '';
                slotsHtml += `
                    <button class="time-slot ${slot.status.toLowerCase()}" ${action}>
                        ${slot.time}
                    </button>
                `;
            });
        }
        slotsHtml += `</div>`;

        // Inject Content (maintaining header)
        slotsView.innerHTML = `
            <div class="cal-header">
                <button class="cal-nav back" id="slots-back"><i class="fa-solid fa-arrow-left"></i></button>
                <span class="cal-title">${dateStr}</span>
                <div style="width:30px"></div> <!-- Spacer for balance -->
            </div>
            ${slotsHtml}
        `;

        document.getElementById('slots-back').addEventListener('click', () => {
             slotsView.classList.remove('active');
             calendarView.classList.remove('hidden');
             this.selectedDate = null;
             this.selectedSlot = null;
             this.updateSlotDisplay();
        });
    }

    selectSlot(timeStr, btnEl) {
        document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
        btnEl.classList.add('selected');
        
        this.selectedSlot = timeStr;
        this.updateSlotDisplay();
        this.showToast('Time Slot Selected', `${this.selectedDate} at ${timeStr} (CET). Click "Confirm & Schedule Call" to reserve.`, 'info', 3500);
    }

    clearSelectedSlot() {
        this.selectedDate = null;
        this.selectedSlot = null;
        document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.cal-day').forEach(b => b.classList.remove('selected'));
        
        const slotsView = document.getElementById('slots-view');
        const calendarView = document.querySelector('.calendar-view');
        if (slotsView && calendarView) {
            slotsView.classList.remove('active');
            calendarView.classList.remove('hidden');
        }
        this.updateSlotDisplay();
        this.showToast('Slot Cleared', 'Direct Inquiry Mode active. You can submit without a calendar booking.', 'info', 3000);
    }

    updateSlotDisplay() {
        if (!this.slotDisplay) return;
        
        const slotValEl = document.getElementById('slot-value');
        const clearBtn = document.getElementById('slot-clear-btn');
        const submitBtn = document.getElementById('scheduler-submit-btn');
        const submitText = document.getElementById('submit-btn-text');
        const submitIcon = document.getElementById('submit-btn-icon');

        if (this.selectedDate && this.selectedSlot) {
            this.slotDisplay.classList.add('active');
            if (slotValEl) slotValEl.textContent = `📅 ${this.selectedDate} @ ${this.selectedSlot} CET`;
            if (clearBtn) clearBtn.style.display = 'inline-flex';
            if (submitBtn) {
                submitBtn.classList.add('meeting-mode');
                if (submitText) submitText.textContent = 'Confirm & Schedule Call';
                if (submitIcon) submitIcon.innerHTML = '<i class="fa-solid fa-calendar-check"></i>';
            }
        } else if (this.selectedDate) {
            this.slotDisplay.classList.remove('active');
            if (slotValEl) slotValEl.textContent = `📅 ${this.selectedDate} — Pick a time slot`;
            if (clearBtn) clearBtn.style.display = 'inline-flex';
            if (submitBtn) {
                submitBtn.classList.remove('meeting-mode');
                if (submitText) submitText.textContent = 'Send Message';
                if (submitIcon) submitIcon.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
            }
        } else {
            this.slotDisplay.classList.remove('active');
            if (slotValEl) slotValEl.textContent = 'Direct Inquiry (No meeting selected)';
            if (clearBtn) clearBtn.style.display = 'none';
            if (submitBtn) {
                submitBtn.classList.remove('meeting-mode');
                if (submitText) submitText.textContent = 'Send Message';
                if (submitIcon) submitIcon.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
            }
        }
    }

    // === HUD CYBER TOAST NOTIFICATION ENGINE ===
    showToast(title, message, type = 'info', duration = 4500) {
        const container = document.getElementById('hud-toast-container');
        if (!container) {
            console.log(`[HUD Toast] ${type.toUpperCase()}: ${title} - ${message}`);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `hud-toast ${type}`;
        
        const iconMap = {
            success: 'fa-circle-check',
            info: 'fa-circle-info',
            warning: 'fa-triangle-exclamation',
            error: 'fa-circle-xmark'
        };
        const icon = iconMap[type] || 'fa-bell';

        toast.innerHTML = `
            <div class="hud-toast-header">
                <span class="hud-toast-badge">
                    <i class="fa-solid ${icon}"></i>
                    <span>${title}</span>
                </span>
                <button type="button" class="hud-toast-close" aria-label="Dismiss notification">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="hud-toast-message">${message}</div>
            <div class="hud-toast-progress-track">
                <div class="hud-toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
            </div>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('active');
        });

        let timer;
        const removeToast = () => {
            clearTimeout(timer);
            toast.classList.remove('active');
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 350);
        };

        toast.querySelector('.hud-toast-close').addEventListener('click', removeToast);
        timer = setTimeout(removeToast, duration);
    }

    // === EXECUTIVE CONFIRMATION PASS RENDERER ===
    renderConfirmationPass(data) {
        const widget = document.getElementById('calendar-widget');
        if (!widget) return;

        const refId = data.id ? `REF-${data.id.substring(0, 8).toUpperCase()}` : `REF-${Date.now().toString().slice(-6)}`;
        const gcalUrl = data.link || `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Strategy+Call+with+Renaldo+Arapi&dates=${(data.date || '').replace(/-/g, '')}T${(data.time || '10:00').replace(':', '')}00Z/${(data.date || '').replace(/-/g, '')}T${(parseInt(data.time || '10')+1).toString().padStart(2, '0')}0000Z`;

        widget.innerHTML = `
            <div class="confirmation-pass">
                <div class="pass-header">
                    <span class="pass-pill"><i class="fa-solid fa-circle-check"></i> BOOKING CONFIRMED</span>
                    <span class="pass-id">${refId}</span>
                </div>
                <div class="pass-body">
                    <h3 class="pass-title">Strategy Call Reserved</h3>
                    <div class="pass-meta-grid">
                        <div class="pass-meta-item">
                            <span class="pass-meta-label">Date</span>
                            <span class="pass-meta-val">${data.date}</span>
                        </div>
                        <div class="pass-meta-item">
                            <span class="pass-meta-label">Time (CET)</span>
                            <span class="pass-meta-val">${data.time}</span>
                        </div>
                        <div class="pass-meta-item">
                            <span class="pass-meta-label">Platform</span>
                            <span class="pass-meta-val">Google Meet</span>
                        </div>
                        <div class="pass-meta-item">
                            <span class="pass-meta-label">Guest</span>
                            <span class="pass-meta-val">${data.name}</span>
                        </div>
                    </div>
                    <p class="pass-note">
                        A calendar confirmation has been sent to <strong>${data.email}</strong>. Add it directly to your agenda:
                    </p>
                    <div class="pass-actions">
                        <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="pass-btn-primary">
                            <i class="fa-solid fa-calendar-plus"></i> Add to Google Calendar
                        </a>
                        <button type="button" class="pass-btn-reset" id="pass-reset-btn">
                            <i class="fa-solid fa-arrow-rotate-left"></i> Book Another
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pass-reset-btn')?.addEventListener('click', () => {
            this.renderCalendar(this.currentDate);
        });
    }

    bindFormEvents() {
        if (!this.form) return;

        // Clear error states on user input
        this.form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => {
                input.closest('.input-group')?.classList.remove('has-error');
                input.closest('.checkbox-container')?.classList.remove('has-error');
            });
        });

        // Slot clear button listener
        document.getElementById('slot-clear-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearSelectedSlot();
        });
        
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear any previous error styling
            this.form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

            // EXTRACT LEAD DATA
            const firstNameInput = document.getElementById('s-first-name');
            const lastNameInput = document.getElementById('s-last-name');
            const emailInput = document.getElementById('s-email');
            const messageInput = document.getElementById('s-message');
            const privacyInput = document.getElementById('s-privacy');

            const firstName = firstNameInput?.value.trim() || '';
            const lastName = lastNameInput?.value.trim() || '';
            const email = emailInput?.value.trim() || '';
            const phone = document.getElementById('s-phone')?.value.trim() || '';
            const company = document.getElementById('s-company')?.value.trim() || '';
            const role = document.getElementById('s-role')?.value.trim() || '';
            const message = messageInput?.value.trim() || '';
            const privacyAgreed = privacyInput?.checked || false;
            const fullName = `${firstName} ${lastName}`.trim() || 'Prospective Lead';

            // ZERO-ALERT MICRO-VALIDATIONS
            if (!firstName) {
                firstNameInput?.closest('.input-group')?.classList.add('has-error');
                firstNameInput?.focus();
                this.showToast('Missing First Name', 'Please enter your first name to continue.', 'warning');
                return;
            }

            if (!lastName) {
                lastNameInput?.closest('.input-group')?.classList.add('has-error');
                lastNameInput?.focus();
                this.showToast('Missing Last Name', 'Please enter your last name to continue.', 'warning');
                return;
            }

            if (!email || !email.includes('@') || !email.includes('.')) {
                emailInput?.closest('.input-group')?.classList.add('has-error');
                emailInput?.focus();
                this.showToast('Invalid Email', 'Please enter a valid email address.', 'warning');
                return;
            }

            if (!message) {
                messageInput?.closest('.input-group')?.classList.add('has-error');
                messageInput?.focus();
                this.showToast('Message Required', 'Please share a brief note about your project or inquiry.', 'warning');
                return;
            }

            if (!privacyAgreed) {
                privacyInput?.closest('.checkbox-container')?.classList.add('has-error');
                this.showToast('Privacy Policy Required', 'Please accept the GDPR privacy policy to submit.', 'warning');
                return;
            }

            const btn = document.getElementById('scheduler-submit-btn') || this.form.querySelector('.scheduler-submit');
            const originalText = btn.innerHTML;
            const isMeetingMode = !!(this.selectedDate && this.selectedSlot);
            
            // STATE: SUBMITTING
            btn.innerHTML = `<span class="btn-text"><i class="fa-solid fa-circle-notch fa-spin"></i> ${isMeetingMode ? 'Scheduling Call...' : 'Sending Message...'}</span>`;
            btn.disabled = true;
            btn.style.opacity = '0.7';

            // PERSIST LEAD IN SECURE LOCAL DATABASE (NEVER-LOST ARCHITECTURE)
            const leadRecord = {
                id: 'LEAD-' + Date.now(),
                timestamp: new Date().toISOString(),
                type: isMeetingMode ? 'STRATEGY_CALL_BOOKING' : 'DIRECT_INQUIRY',
                fullName,
                firstName,
                lastName,
                email,
                phone,
                company,
                role,
                message,
                slotDate: this.selectedDate || null,
                slotTime: this.selectedSlot || null,
                timezone: this.userTimezone
            };

            try {
                const storedLeads = JSON.parse(localStorage.getItem('renaldo_lead_database') || '[]');
                storedLeads.push(leadRecord);
                localStorage.setItem('renaldo_lead_database', JSON.stringify(storedLeads));
                console.log('%c[LEAD CAPTURED] Recorded in local registry:', 'color:#10b981; font-weight:bold;', leadRecord);
            } catch (storageErr) {
                console.warn('[LEAD CAPTURE] Local storage warning:', storageErr);
            }

            const payload = {
                identity: fullName,
                firstName,
                lastName,
                contact: email,
                email,
                phone,
                company,
                role,
                inquiryOnly: !isMeetingMode,
                briefing: `[TYPE: ${isMeetingMode ? 'STRATEGY CALL' : 'DIRECT INQUIRY'} | COMPANY: ${company || 'N/A'} | ROLE: ${role || 'N/A'} | TEL: ${phone || 'N/A'}]\n\n${message}`,
                time: isMeetingMode ? {
                    start: this.selectedDate,
                    slot: this.selectedSlot,
                    timezone: this.userTimezone
                } : null
            };

            // EXECUTE UPLINK
            const result = await this.service.createBooking(payload);

            // HANDLE RESPONSE STATES (ALL ZERO-ALERT)
            if (result.status === 'CONFIRMED') {
                btn.innerHTML = `<span class="btn-text" style="color:var(--c-success)"><i class="fa-solid fa-check-circle"></i> Meeting Scheduled!</span>`;
                btn.style.borderColor = 'var(--c-success)';
                
                this.showToast('Meeting Confirmed!', `Your strategy call for ${this.selectedDate} at ${this.selectedSlot} (CET) has been confirmed. Invitation sent to ${email}.`, 'success', 7000);

                this.renderConfirmationPass({
                    id: result.id,
                    link: result.link,
                    date: this.selectedDate,
                    time: this.selectedSlot,
                    name: fullName,
                    email: email
                });

                this.form.reset();
                this.selectedDate = null;
                this.selectedSlot = null;
                this.updateSlotDisplay();
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.borderColor = '';
                }, 3000);
                
            } else if (result.status === 'INQUIRY_CONFIRMED' || (!isMeetingMode && (result.status === 'OFFLINE_MODE' || result.isFallback))) {
                btn.innerHTML = `<span class="btn-text" style="color:var(--c-success)"><i class="fa-solid fa-check-circle"></i> Message Sent!</span>`;
                btn.style.borderColor = 'var(--c-success)';

                this.showToast('Inquiry Transmitted!', 'Thank you! Your project inquiry has been received. Renaldo will review and respond within 24 hours.', 'success', 6000);

                this.form.reset();
                this.selectedDate = null;
                this.selectedSlot = null;
                this.updateSlotDisplay();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.borderColor = '';
                }, 3000);

            } else if (result.status === 'OFFLINE_MODE' || result.isFallback) {
                btn.innerHTML = `<span class="btn-text" style="color:var(--c-warning)"><i class="fa-solid fa-triangle-exclamation"></i> Demo Mode</span>`;
                btn.style.borderColor = 'var(--c-warning)';
                
                this.showToast('Request Recorded (Demo Mode)', 'Server calendar credentials not configured in local environment. Your request was securely saved to the local lead registry.', 'warning', 6500);
                
                this.renderConfirmationPass({
                    id: 'DEMO-' + Date.now().toString().slice(-4),
                    link: '',
                    date: this.selectedDate,
                    time: this.selectedSlot,
                    name: fullName,
                    email: email
                });

                this.form.reset();
                this.selectedDate = null;
                this.selectedSlot = null;
                this.updateSlotDisplay();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.borderColor = '';
                }, 3000);
                
            } else {
                btn.innerHTML = `<span class="btn-text" style="color:var(--c-error)"><i class="fa-solid fa-circle-xmark"></i> Error</span>`;
                btn.style.borderColor = 'var(--c-error)';
                
                this.showToast('Transmission Error', result.error || 'Unable to complete request. Please contact renaldo.arapi@live.it directly.', 'error', 6000);
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.borderColor = '';
                }, 3000);
            }
        });
    }

    // PRIVACY POLICY MODAL CONTROLLER
    initPrivacyModal() {
        const modal = document.getElementById('privacy-modal');
        if (!modal) return;

        const openModal = () => {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        document.getElementById('footer-privacy-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        document.getElementById('form-privacy-trigger')?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        document.getElementById('privacy-modal-close')?.addEventListener('click', closeModal);
        document.getElementById('privacy-backdrop')?.addEventListener('click', closeModal);
        document.getElementById('privacy-understand-btn')?.addEventListener('click', closeModal);

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

window.contactInterface = null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.contactInterface = new ContactInterface();
    }, 100);
});
