# Real-Time Computer Vision & Edge Inference Pipeline

## Overview
- **Project Domain**: Deep Learning & Computer Vision (Personal End-to-End Production System)
- **Engineering Role**: Deep Learning & Computer Vision Engineer
- **Core Technology Stack**: PyTorch, YOLOv8/v11, OpenCV, Albumentations, TensorRT, FastAPI, Docker

## Mission & Problem Statement
High-throughput computer vision applications in industrial inspection and spatial tracking require low-latency inference on edge devices with strict power and memory budgets. The objective was to design, train, and deploy an end-to-end computer vision pipeline capable of sustained real-time object detection and spatial boundary segmentation with sub-15ms per-frame latency.

## Architecture & System Design
The pipeline spans data preparation, deep neural network training, model optimization, and containerized serving:
1. **Data Pipeline & Augmentation**: Curated multi-class image datasets with robust augmentation pipelines using Albumentations (random perspective transforms, mosaic augmentation, HSV jitter, and motion blur) to ensure generalization across lighting variations.
2. **Deep Neural Network Backbone**: Trained custom YOLO object detection and segmentation models in PyTorch, leveraging feature pyramid networks (PAN-FPN) for multi-scale feature aggregation.
3. **Model Quantization & TensorRT Compilation**: Exported trained PyTorch models to ONNX and compiled with NVIDIA TensorRT applying FP16 half-precision and INT8 quantization, maximizing GPU tensor core utilization.
4. **Asynchronous Edge Serving (FastAPI & Docker)**: Packaged inference engine into lightweight containerized microservices utilizing zero-copy frame buffer streaming and asynchronous endpoint dispatch.

## Key Engineering Challenges & Solutions
- **Challenge**: Mitigating severe frame drop during high-resolution multi-stream video feeds.
  - *Solution*: Implemented asynchronous producer-consumer frame buffering with ring buffers in OpenCV, decoupling video ingest from neural inference.
- **Challenge**: Overfitting to fixed camera positions and synthetic lighting conditions.
  - *Solution*: Applied aggressive geometric augmentation and mosaic mixup, achieving high validation mAP across diverse background manifolds.
- **Challenge**: Reducing memory footprint for constrained edge deployment.
  - *Solution*: TensorRT FP16 quantization reduced model weight footprint by 52% while accelerating inference throughput by 2.8x.

## Verifiable Impact & Metrics
- **Throughput & Speed**: Sustained 60+ FPS on edge GPU hardware with an average per-frame inference latency of 11.2ms.
- **Detection Accuracy**: Achieved 0.884 mAP@0.5 across target detection classes.
- **Resource Footprint**: Containerized edge image weighing under 1.2GB with deterministic cold-start initialization under 1.8 seconds.
