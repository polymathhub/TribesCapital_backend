import AppKit
import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation

let canvasWidth = 1920
let canvasHeight = 1080
let frameRate: Int32 = 24
let durationSeconds = 20.0
let frameCount = Int(durationSeconds * Double(frameRate))

struct Point {
    let x: CGFloat
    let y: CGFloat
}

func clamp(_ value: CGFloat, _ low: CGFloat = 0, _ high: CGFloat = 1) -> CGFloat {
    min(high, max(low, value))
}

func smooth(_ value: CGFloat) -> CGFloat {
    let x = clamp(value)
    return x * x * (3 - 2 * x)
}

func ramp(_ time: Double, _ start: Double, _ end: Double) -> CGFloat {
    guard end > start else { return time >= end ? 1 : 0 }
    return smooth(CGFloat((time - start) / (end - start)))
}

func color(_ hex: UInt32, alpha: CGFloat = 1) -> CGColor {
    CGColor(
        red: CGFloat((hex >> 16) & 0xff) / 255,
        green: CGFloat((hex >> 8) & 0xff) / 255,
        blue: CGFloat(hex & 0xff) / 255,
        alpha: alpha
    )
}

func nsColor(_ hex: UInt32, alpha: CGFloat = 1) -> NSColor {
    NSColor(
        calibratedRed: CGFloat((hex >> 16) & 0xff) / 255,
        green: CGFloat((hex >> 8) & 0xff) / 255,
        blue: CGFloat(hex & 0xff) / 255,
        alpha: alpha
    )
}

func rectFromTop(_ x: CGFloat, _ y: CGFloat, _ width: CGFloat, _ height: CGFloat) -> CGRect {
    CGRect(x: x, y: CGFloat(canvasHeight) - y - height, width: width, height: height)
}

func pointFromTop(_ point: Point) -> CGPoint {
    CGPoint(x: point.x, y: CGFloat(canvasHeight) - point.y)
}

func drawText(
    _ text: String,
    context: CGContext,
    x: CGFloat,
    y: CGFloat,
    width: CGFloat,
    height: CGFloat,
    size: CGFloat,
    weight: NSFont.Weight = .regular,
    colorHex: UInt32 = 0xffffff,
    alpha: CGFloat = 1,
    alignment: NSTextAlignment = .left,
    tracking: CGFloat = 0
) {
    let style = NSMutableParagraphStyle()
    style.alignment = alignment
    style.lineBreakMode = .byWordWrapping
    let attributes: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: nsColor(colorHex, alpha: alpha),
        .paragraphStyle: style,
        .kern: tracking,
    ]
    let graphics = NSGraphicsContext(cgContext: context, flipped: false)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    NSAttributedString(string: text, attributes: attributes).draw(
        in: NSRect(x: x, y: CGFloat(canvasHeight) - y - height, width: width, height: height)
    )
    NSGraphicsContext.restoreGraphicsState()
}

func drawLine(_ context: CGContext, from start: Point, to end: Point, width: CGFloat, colorHex: UInt32, alpha: CGFloat) {
    context.saveGState()
    context.setLineWidth(width)
    context.setLineCap(.round)
    context.setStrokeColor(color(colorHex, alpha: alpha))
    context.move(to: pointFromTop(start))
    context.addLine(to: pointFromTop(end))
    context.strokePath()
    context.restoreGState()
}

func drawRing(_ context: CGContext, center: Point, radius: CGFloat, width: CGFloat, colorHex: UInt32, alpha: CGFloat) {
    context.saveGState()
    context.setLineWidth(width)
    context.setStrokeColor(color(colorHex, alpha: alpha))
    context.strokeEllipse(in: rectFromTop(center.x - radius, center.y - radius, radius * 2, radius * 2))
    context.restoreGState()
}

func drawNode(_ context: CGContext, center: Point, radius: CGFloat, alpha: CGFloat, emphasized: Bool = false) {
    context.saveGState()
    context.setFillColor(color(0x110B20, alpha: 0.98))
    context.fillEllipse(in: rectFromTop(center.x - radius - 5, center.y - radius - 5, radius * 2 + 10, radius * 2 + 10))
    context.setLineWidth(emphasized ? 2.5 : 1.5)
    context.setStrokeColor(color(0xC4B5FD, alpha: alpha))
    context.strokeEllipse(in: rectFromTop(center.x - radius, center.y - radius, radius * 2, radius * 2))
    context.setFillColor(color(0xA855F7, alpha: alpha * 0.82))
    context.fillEllipse(in: rectFromTop(center.x - 4, center.y - 4, 8, 8))
    context.restoreGState()
}

func drawMark(_ image: CGImage, context: CGContext, centerX: CGFloat, top: CGFloat, size: CGFloat, alpha: CGFloat, scale: CGFloat = 1) {
    let actualSize = size * scale
    let rect = rectFromTop(centerX - actualSize / 2, top, actualSize, actualSize)
    context.saveGState()
    context.setAlpha(alpha)
    context.interpolationQuality = .high
    context.draw(image, in: rect)
    context.restoreGState()
}

func drawWordmark(_ context: CGContext, y: CGFloat, alpha: CGFloat, size: CGFloat = 35) {
    drawText(
        "TRIBES CAPITAL",
        context: context,
        x: 340,
        y: y,
        width: 1240,
        height: 64,
        size: size,
        weight: .semibold,
        colorHex: 0xffffff,
        alpha: alpha,
        alignment: .center,
        tracking: 5.5
    )
}

func drawBackground(_ context: CGContext, time: Double) {
    let base = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [color(0x090712), color(0x17102B), color(0x0B0914)] as CFArray,
        locations: [0, 0.48, 1]
    )!
    context.drawLinearGradient(base, start: CGPoint(x: 0, y: CGFloat(canvasHeight)), end: CGPoint(x: canvasWidth, y: 0), options: [])

    let glowX = CGFloat(930 + sin(time * 0.23) * 330)
    let glowY = CGFloat(510 + cos(time * 0.17) * 90)
    let glow = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [color(0x5B21B6, alpha: 0.34), color(0x2E1065, alpha: 0.13), color(0x2E1065, alpha: 0)] as CFArray,
        locations: [0, 0.42, 1]
    )!
    context.drawRadialGradient(
        glow,
        startCenter: pointFromTop(Point(x: glowX, y: glowY)),
        startRadius: 0,
        endCenter: pointFromTop(Point(x: glowX, y: glowY)),
        endRadius: 780,
        options: []
    )

    let sweepX = CGFloat(-520 + (time / durationSeconds) * 1850)
    let sweep = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [color(0xC4B5FD, alpha: 0), color(0xC4B5FD, alpha: 0.055), color(0xC4B5FD, alpha: 0)] as CFArray,
        locations: [0, 0.5, 1]
    )!
    context.drawLinearGradient(sweep, start: CGPoint(x: sweepX, y: 0), end: CGPoint(x: sweepX + 460, y: CGFloat(canvasHeight)), options: [])

    context.saveGState()
    context.setStrokeColor(color(0xC4B5FD, alpha: 0.055))
    context.setLineWidth(1)
    for index in 0..<7 {
        let x = CGFloat(150 + index * 270)
        context.move(to: pointFromTop(Point(x: x, y: 98)))
        context.addLine(to: pointFromTop(Point(x: x, y: 982)))
    }
    context.strokePath()
    context.restoreGState()

    drawLine(context, from: Point(x: 112, y: 1000), to: Point(x: 1808, y: 1000), width: 1, colorHex: 0xC4B5FD, alpha: 0.14)
}

func drawOpening(_ context: CGContext, logo: CGImage, time: Double) {
    let reveal = ramp(time, 0.25, 1.45) * (1 - ramp(time, 2.75, 3.55))
    guard reveal > 0.001 else { return }
    let scale = 0.88 + 0.12 * ramp(time, 0.35, 1.65)
    let floatY = CGFloat(sin(time * 0.8) * 5)

    drawRing(context, center: Point(x: 960, y: 438 + floatY), radius: 168, width: 1, colorHex: 0xA855F7, alpha: reveal * 0.22)
    drawMark(logo, context: context, centerX: 960, top: 306 + floatY, size: 184, alpha: reveal, scale: scale)
    drawWordmark(context, y: 546 + floatY, alpha: reveal, size: 34)
    drawLine(context, from: Point(x: 730, y: 647), to: Point(x: 1190, y: 647), width: 1, colorHex: 0xC4B5FD, alpha: reveal * 0.42)
    drawText("CAPITAL  /  CONNECTION  /  OPPORTUNITY", context: context, x: 300, y: 678, width: 1320, height: 30, size: 14, weight: .medium, colorHex: 0xD8D2E5, alpha: reveal * 0.84, alignment: .center, tracking: 3.3)
}

func drawNetwork(_ context: CGContext, time: Double) {
    let visibility = ramp(time, 3.05, 3.75) * (1 - ramp(time, 6.7, 7.55))
    guard visibility > 0.001 else { return }

    let nodes = [
        Point(x: 436, y: 476),
        Point(x: 944, y: 344),
        Point(x: 1480, y: 476),
        Point(x: 955, y: 752),
    ]
    let lineProgress = ramp(time, 3.35, 6.3)
    let segments: [(Int, Int, Double)] = [(0, 1, 0.0), (1, 2, 0.22), (2, 3, 0.46), (3, 0, 0.69), (0, 2, 0.83)]
    for (from, to, offset) in segments {
        let local = clamp((lineProgress - CGFloat(offset)) / CGFloat(1 - offset))
        guard local > 0 else { continue }
        let endPoint = Point(
            x: nodes[from].x + (nodes[to].x - nodes[from].x) * local,
            y: nodes[from].y + (nodes[to].y - nodes[from].y) * local
        )
        drawLine(context, from: nodes[from], to: endPoint, width: 1.5, colorHex: 0x9B7DE5, alpha: visibility * 0.72)
    }

    for (index, node) in nodes.enumerated() {
        let nodeAlpha = visibility * ramp(time, 3.65 + Double(index) * 0.35, 4.35 + Double(index) * 0.35)
        drawRing(context, center: node, radius: CGFloat(22 + sin(time * 1.1 + Double(index)) * 2), width: 1, colorHex: 0xA855F7, alpha: nodeAlpha * 0.48)
        drawNode(context, center: node, radius: index == 1 ? 9 : 7, alpha: nodeAlpha, emphasized: index == 1)
    }

    let labels: [(String, Point, CGFloat)] = [
        ("CAPITAL", Point(x: 310, y: 534), 250),
        ("OPERATORS", Point(x: 814, y: 398), 260),
        ("INNOVATORS", Point(x: 1352, y: 534), 300),
    ]
    for (index, label) in labels.enumerated() {
        let alpha = visibility * ramp(time, 4.0 + Double(index) * 0.4, 4.7 + Double(index) * 0.4)
        drawText(label.0, context: context, x: label.1.x, y: label.1.y, width: label.2, height: 34, size: 15, weight: .semibold, colorHex: 0xF3E8FF, alpha: alpha, alignment: .center, tracking: 3.1)
    }

    drawText("A connected path forward", context: context, x: 420, y: 860, width: 1080, height: 58, size: 28, weight: .regular, colorHex: 0xFFFFFF, alpha: visibility * 0.86, alignment: .center, tracking: 0.1)
}

func drawPositioning(_ context: CGContext, time: Double) {
    let visibility = ramp(time, 6.85, 7.75) * (1 - ramp(time, 12.75, 13.55))
    guard visibility > 0.001 else { return }

    let drift = CGFloat((1 - ramp(time, 6.85, 8.1)) * 32)
    drawText("CLEAN ENERGY INVESTMENT", context: context, x: 190 + drift, y: 294, width: 580, height: 34, size: 15, weight: .semibold, colorHex: 0xC4B5FD, alpha: visibility, tracking: 4.0)
    drawText("Move capital with\nconviction.", context: context, x: 184 + drift, y: 374, width: 1230, height: 232, size: 80, weight: .semibold, colorHex: 0xFFFFFF, alpha: visibility, tracking: -1.4)
    drawLine(context, from: Point(x: 190, y: 644), to: Point(x: 405, y: 644), width: 3, colorHex: 0xA855F7, alpha: visibility)
    drawText(
        "Source credible partners, discover new opportunities, and keep capital and climate action aligned.",
        context: context,
        x: 190 + drift,
        y: 690,
        width: 1040,
        height: 98,
        size: 25,
        weight: .regular,
        colorHex: 0xD8D2E5,
        alpha: visibility * 0.96,
        tracking: 0
    )
}

func drawImpact(_ context: CGContext, time: Double) {
    let visibility = ramp(time, 12.55, 13.45) * (1 - ramp(time, 16.45, 17.45))
    guard visibility > 0.001 else { return }

    let drift = CGFloat((1 - ramp(time, 12.55, 13.65)) * 25)
    drawText("RESILIENT INFRASTRUCTURE", context: context, x: 190 + drift, y: 322, width: 640, height: 34, size: 15, weight: .semibold, colorHex: 0xC4B5FD, alpha: visibility, tracking: 4)
    drawText("Capital. Operators.\nInnovators.", context: context, x: 184 + drift, y: 397, width: 1260, height: 218, size: 73, weight: .semibold, colorHex: 0xFFFFFF, alpha: visibility, tracking: -1.1)
    drawLine(context, from: Point(x: 190, y: 657), to: Point(x: 410, y: 657), width: 3, colorHex: 0xA855F7, alpha: visibility)
    drawText(
        "Together, scale resilient infrastructure and practical impact.",
        context: context,
        x: 190 + drift,
        y: 702,
        width: 1100,
        height: 80,
        size: 25,
        weight: .regular,
        colorHex: 0xD8D2E5,
        alpha: visibility * 0.96
    )
}

func drawClosing(_ context: CGContext, logo: CGImage, time: Double) {
    let visibility = ramp(time, 16.65, 17.55)
    guard visibility > 0.001 else { return }
    let scale = 0.94 + 0.06 * ramp(time, 16.7, 18.15)
    let floatY = CGFloat(sin(time * 0.72) * 3)

    drawMark(logo, context: context, centerX: 960, top: 306 + floatY, size: 178, alpha: visibility, scale: scale)
    drawWordmark(context, y: 541 + floatY, alpha: visibility, size: 34)
    drawLine(context, from: Point(x: 790, y: 634), to: Point(x: 1130, y: 634), width: 1, colorHex: 0xC4B5FD, alpha: visibility * 0.48)
    drawText("community.tribes.capital", context: context, x: 420, y: 672, width: 1080, height: 40, size: 21, weight: .medium, colorHex: 0xF3E8FF, alpha: visibility, alignment: .center, tracking: 1.25)
    drawText("EXPLORE THE COMMUNITY", context: context, x: 540, y: 754, width: 840, height: 30, size: 12, weight: .semibold, colorHex: 0xC4B5FD, alpha: visibility * 0.82, alignment: .center, tracking: 3.6)
}

func renderFrame(time: Double, logo: CGImage, context: CGContext) {
    context.setFillColor(color(0x090712))
    context.fill(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
    drawBackground(context, time: time)
    drawOpening(context, logo: logo, time: time)
    drawNetwork(context, time: time)
    drawPositioning(context, time: time)
    drawImpact(context, time: time)
    drawClosing(context, logo: logo, time: time)
}

func savePNG(image: CGImage, to url: URL) throws {
    let bitmap = NSBitmapImageRep(cgImage: image)
    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "TribesCapitalFilm", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not encode poster PNG"])
    }
    try data.write(to: url, options: .atomic)
}

func makeContext(pixelBuffer: CVPixelBuffer) -> CGContext? {
    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return nil }
    return CGContext(
        data: baseAddress,
        width: canvasWidth,
        height: canvasHeight,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
    )
}

func renderStill(logo: CGImage, time: Double, outputURL: URL) throws {
    guard let context = CGContext(data: nil, width: canvasWidth, height: canvasHeight, bitsPerComponent: 8, bytesPerRow: canvasWidth * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue) else {
        throw NSError(domain: "TribesCapitalFilm", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not allocate poster canvas"])
    }
    renderFrame(time: time, logo: logo, context: context)
    guard let image = context.makeImage() else {
        throw NSError(domain: "TribesCapitalFilm", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not create poster image"])
    }
    try savePNG(image: image, to: outputURL)
}

func encodeSilentVideo(logo: CGImage, outputURL: URL) throws {
    try? FileManager.default.removeItem(at: outputURL)
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mov)
    let settings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: canvasWidth,
        AVVideoHeightKey: canvasHeight,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 14_000_000,
            AVVideoMaxKeyFrameIntervalKey: 48,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        ],
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false
    let attributes: [String: Any] = [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: canvasWidth,
        kCVPixelBufferHeightKey as String: canvasHeight,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
        kCVPixelBufferIOSurfacePropertiesKey as String: [:],
    ]
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attributes)
    guard writer.canAdd(input) else {
        throw NSError(domain: "TribesCapitalFilm", code: 5, userInfo: [NSLocalizedDescriptionKey: "Video writer rejected H.264 input"])
    }
    writer.add(input)
    guard writer.startWriting() else {
        throw writer.error ?? NSError(domain: "TribesCapitalFilm", code: 6, userInfo: [NSLocalizedDescriptionKey: "Could not start video writer"])
    }
    writer.startSession(atSourceTime: .zero)

    for frame in 0..<frameCount {
        while !input.isReadyForMoreMediaData {
            Thread.sleep(forTimeInterval: 0.003)
        }
        guard let pool = adaptor.pixelBufferPool else {
            throw NSError(domain: "TribesCapitalFilm", code: 7, userInfo: [NSLocalizedDescriptionKey: "Video pixel-buffer pool is unavailable"])
        }
        var maybeBuffer: CVPixelBuffer?
        let result = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &maybeBuffer)
        guard result == kCVReturnSuccess, let pixelBuffer = maybeBuffer else {
            throw NSError(domain: "TribesCapitalFilm", code: 8, userInfo: [NSLocalizedDescriptionKey: "Could not allocate video frame \(frame)"])
        }
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        guard let context = makeContext(pixelBuffer: pixelBuffer) else {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
            throw NSError(domain: "TribesCapitalFilm", code: 9, userInfo: [NSLocalizedDescriptionKey: "Could not draw video frame \(frame)"])
        }
        renderFrame(time: Double(frame) / Double(frameRate), logo: logo, context: context)
        CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
        let presentationTime = CMTime(value: Int64(frame), timescale: frameRate)
        guard adaptor.append(pixelBuffer, withPresentationTime: presentationTime) else {
            throw writer.error ?? NSError(domain: "TribesCapitalFilm", code: 10, userInfo: [NSLocalizedDescriptionKey: "Could not append video frame \(frame)"])
        }
    }

    input.markAsFinished()
    let finished = DispatchSemaphore(value: 0)
    writer.finishWriting { finished.signal() }
    finished.wait()
    guard writer.status == .completed else {
        throw writer.error ?? NSError(domain: "TribesCapitalFilm", code: 11, userInfo: [NSLocalizedDescriptionKey: "Video writer did not complete"])
    }
}

func muxAudio(videoURL: URL, audioURL: URL, outputURL: URL) throws {
    let composition = AVMutableComposition()
    let videoAsset = AVURLAsset(url: videoURL)
    let audioAsset = AVURLAsset(url: audioURL)
    let duration = CMTime(seconds: durationSeconds, preferredTimescale: 600)
    let range = CMTimeRange(start: .zero, duration: duration)

    guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
          let destinationVideo = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw NSError(domain: "TribesCapitalFilm", code: 12, userInfo: [NSLocalizedDescriptionKey: "Rendered video track is missing"])
    }
    try destinationVideo.insertTimeRange(range, of: sourceVideo, at: .zero)

    guard let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
          let destinationAudio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw NSError(domain: "TribesCapitalFilm", code: 13, userInfo: [NSLocalizedDescriptionKey: "Generated soundtrack track is missing"])
    }
    try destinationAudio.insertTimeRange(range, of: sourceAudio, at: .zero)

    try? FileManager.default.removeItem(at: outputURL)
    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
        throw NSError(domain: "TribesCapitalFilm", code: 14, userInfo: [NSLocalizedDescriptionKey: "Could not create MP4 export session"])
    }
    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.timeRange = range
    exporter.shouldOptimizeForNetworkUse = true
    let finished = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously { finished.signal() }
    finished.wait()
    guard exporter.status == .completed else {
        throw exporter.error ?? NSError(domain: "TribesCapitalFilm", code: 15, userInfo: [NSLocalizedDescriptionKey: "MP4 export did not complete"])
    }
}

func argument(after flag: String) -> String? {
    guard let index = CommandLine.arguments.firstIndex(of: flag), index + 1 < CommandLine.arguments.count else { return nil }
    return CommandLine.arguments[index + 1]
}

do {
    guard let outputPath = argument(after: "--output-dir"),
          let logoPath = argument(after: "--logo") else {
        throw NSError(domain: "TribesCapitalFilm", code: 16, userInfo: [NSLocalizedDescriptionKey: "Usage: swift composition.swift --output-dir <path> --logo <official-logo-png> [--audio <soundtrack.wav>] [--poster-only]"])
    }
    let outputDirectory = URL(fileURLWithPath: outputPath, isDirectory: true)
    try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
    guard let logo = NSImage(contentsOfFile: logoPath)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        throw NSError(domain: "TribesCapitalFilm", code: 17, userInfo: [NSLocalizedDescriptionKey: "Could not read official logo asset at \(logoPath)"])
    }

    let previewTime = Double(argument(after: "--poster-time") ?? "9.2") ?? 9.2
    let posterName = argument(after: "--poster-name") ?? "poster.png"
    let posterURL = outputDirectory.appendingPathComponent(posterName)
    try renderStill(logo: logo, time: previewTime, outputURL: posterURL)
    print("Still rendered: \(posterURL.path)")

    if !CommandLine.arguments.contains("--poster-only") {
        guard let audioPath = argument(after: "--audio") else {
            throw NSError(domain: "TribesCapitalFilm", code: 18, userInfo: [NSLocalizedDescriptionKey: "Full render requires --audio <soundtrack.wav>"])
        }
        let silentURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("tribes-capital-visual.mov")
        let finalURL = outputDirectory.appendingPathComponent("tribescapital-launch-film.mp4")
        try encodeSilentVideo(logo: logo, outputURL: silentURL)
        print("Visual render complete; muxing original soundtrack...")
        try muxAudio(videoURL: silentURL, audioURL: URL(fileURLWithPath: audioPath), outputURL: finalURL)
        try? FileManager.default.removeItem(at: silentURL)
        print("MP4 rendered: \(finalURL.path)")
    }
} catch {
    fputs("Render failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}
