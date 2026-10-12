import AppKit
import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation

let canvasWidth = 1920
let canvasHeight = 1080
let frameRate: Int32 = 24
let transitionDuration = 0.38

struct Scene {
    let image: String
    let chapter: String
    let title: String
    let caption: String
    let duration: Double
    let focus: CGRect
}

let scenes: [Scene] = [
    Scene(image: "sign-in-production.png", chapter: "01  ACCESS", title: "Sign in", caption: "Sign in to access the community.", duration: 4.0, focus: CGRect(x: 0.30, y: 0.28, width: 0.42, height: 0.44)),
    Scene(image: "signup-production.png", chapter: "01  ACCESS", title: "Create account", caption: "Choose an account type and complete the required fields.", duration: 2.3, focus: CGRect(x: 0.25, y: 0.18, width: 0.50, height: 0.56)),
    Scene(image: "signup-details-production.png", chapter: "01  ACCESS", title: "Account details", caption: "Review password, consent, and sign-in alternatives; form stays blank.", duration: 2.3, focus: CGRect(x: 0.25, y: 0.17, width: 0.50, height: 0.64)),
    Scene(image: "admin-sign-in-production.png", chapter: "01  ACCESS", title: "Administrator sign in", caption: "Administrator access is a separate protected entry.", duration: 3.0, focus: CGRect(x: 0.31, y: 0.28, width: 0.40, height: 0.46)),
    Scene(image: "reset-production.png", chapter: "01  ACCESS", title: "Password recovery", caption: "Enter an email to request a reset code.", duration: 3.4, focus: CGRect(x: 0.30, y: 0.34, width: 0.42, height: 0.38)),
    Scene(image: "home-production.png", chapter: "02  FIND YOUR WAY", title: "Home", caption: "Start with a goal, then move into the matching area.", duration: 5.0, focus: CGRect(x: 0.08, y: 0.17, width: 0.78, height: 0.60)),
    Scene(image: "learning-production.png", chapter: "03  LEARN", title: "Learning Hub", caption: "Explore the recommended path and course status.", duration: 3.0, focus: CGRect(x: 0.05, y: 0.15, width: 0.54, height: 0.62)),
    Scene(image: "learning-filters-production.png", chapter: "03  LEARN", title: "Courses and filters", caption: "Scroll to topic filters and course cards; no course is started.", duration: 3.0, focus: CGRect(x: 0.05, y: 0.13, width: 0.55, height: 0.68)),
    Scene(image: "portfolio-production.png", chapter: "04  PROJECTS", title: "Project Pipeline", caption: "Track projects by stage. This member view currently has no visible projects.", duration: 4.6, focus: CGRect(x: 0.05, y: 0.16, width: 0.60, height: 0.62)),
    Scene(image: "forum-production.png", chapter: "05  COMMUNITY", title: "Forum", caption: "Browse topics and join the community conversation.", duration: 6.0, focus: CGRect(x: 0.05, y: 0.14, width: 0.58, height: 0.64)),
    Scene(image: "forum-question-production.png", chapter: "05  COMMUNITY", title: "Ask a question", caption: "Choose a category and draft a question. Posting is not demonstrated.", duration: 4.0, focus: CGRect(x: 0.18, y: 0.06, width: 0.70, height: 0.76)),
    Scene(image: "messaging-redacted-production.png", chapter: "06  MESSAGES", title: "Messages", caption: "Messages are available; private conversation content is intentionally withheld.", duration: 5.0, focus: CGRect(x: 0.05, y: 0.14, width: 0.88, height: 0.62)),
    Scene(image: "events-production.png", chapter: "07  EVENTS", title: "Office Hours & Events", caption: "Browse sessions, replays, and RSVP status.", duration: 6.0, focus: CGRect(x: 0.05, y: 0.14, width: 0.75, height: 0.64)),
    Scene(image: "event-details-production.png", chapter: "07  EVENTS", title: "Event details", caption: "Review the session details before deciding whether to attend.", duration: 4.2, focus: CGRect(x: 0.46, y: 0.08, width: 0.48, height: 0.74)),
    Scene(image: "create-event-production.png", chapter: "07  EVENTS", title: "Create event", caption: "Event creation is a form, not a published event in this walkthrough.", duration: 4.5, focus: CGRect(x: 0.22, y: 0.06, width: 0.62, height: 0.76)),
    Scene(image: "submit-project-production.png", chapter: "08  PROJECT INTAKE", title: "Submit Your Project", caption: "Share project details through the prepared email handoff.", duration: 4.7, focus: CGRect(x: 0.05, y: 0.14, width: 0.62, height: 0.66)),
    Scene(image: "help-production.png", chapter: "09  SUPPORT", title: "Help & Support", caption: "Find answers or contact the team from Help & Support.", duration: 5.0, focus: CGRect(x: 0.05, y: 0.14, width: 0.66, height: 0.66)),
    Scene(image: "help-tour-production.png", chapter: "09  SUPPORT", title: "Platform tour", caption: "The tour describes more areas than this account can access.", duration: 5.0, focus: CGRect(x: 0.25, y: 0.16, width: 0.50, height: 0.54)),
    Scene(image: "profile-production.png", chapter: "10  YOUR ACCOUNT", title: "Member profile", caption: "The member profile brings identity, interests, and professional links together.", duration: 4.5, focus: CGRect(x: 0.05, y: 0.14, width: 0.58, height: 0.64)),
    Scene(image: "edit-profile-production.png", chapter: "10  YOUR ACCOUNT", title: "Edit profile", caption: "Profile updates remain unsaved in this capture.", duration: 5.0, focus: CGRect(x: 0.20, y: 0.08, width: 0.60, height: 0.74)),
    Scene(image: "settings-production.png", chapter: "10  YOUR ACCOUNT", title: "Settings", caption: "Review account details, notifications, and access controls.", duration: 4.1, focus: CGRect(x: 0.05, y: 0.14, width: 0.72, height: 0.64)),
    Scene(image: "notifications-redacted-production.png", chapter: "10  YOUR ACCOUNT", title: "Notifications", caption: "Unread activity is visible without exposing member notifications.", duration: 3.5, focus: CGRect(x: 0.56, y: 0.12, width: 0.39, height: 0.63)),
    Scene(image: "home-production.png", chapter: "CLOSE", title: "Community Member view", caption: "Captured from the Community Member experience at community.tribes.capital.", duration: 3.0, focus: CGRect(x: 0.08, y: 0.17, width: 0.78, height: 0.60)),
]

let durationSeconds = scenes.reduce(0.0) { $0 + $1.duration }
let frameCount = Int(durationSeconds * Double(frameRate))

func clamp(_ value: CGFloat, _ low: CGFloat = 0, _ high: CGFloat = 1) -> CGFloat {
    min(high, max(low, value))
}

func smooth(_ value: CGFloat) -> CGFloat {
    let x = clamp(value)
    return x * x * (3 - 2 * x)
}

func color(_ hex: UInt32, alpha: CGFloat = 1) -> CGColor {
    CGColor(
        red: CGFloat((hex >> 16) & 0xff) / 255,
        green: CGFloat((hex >> 8) & 0xff) / 255,
        blue: CGFloat(hex & 0xff) / 255,
        alpha: alpha
    )
}

func rectFromTop(_ x: CGFloat, _ y: CGFloat, _ width: CGFloat, _ height: CGFloat) -> CGRect {
    CGRect(x: x, y: CGFloat(canvasHeight) - y - height, width: width, height: height)
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
    alpha: CGFloat = 1
) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = .left
    paragraph.lineBreakMode = .byWordWrapping
    let attributes: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: NSColor(
            calibratedRed: CGFloat((colorHex >> 16) & 0xff) / 255,
            green: CGFloat((colorHex >> 8) & 0xff) / 255,
            blue: CGFloat(colorHex & 0xff) / 255,
            alpha: alpha
        ),
        .paragraphStyle: paragraph,
    ]
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    NSAttributedString(string: text, attributes: attributes).draw(
        in: NSRect(x: x, y: CGFloat(canvasHeight) - y - height, width: width, height: height)
    )
    NSGraphicsContext.restoreGraphicsState()
}

func drawScene(
    _ scene: Scene,
    image: CGImage,
    progress: CGFloat,
    alpha: CGFloat,
    context: CGContext
) {
    let focusX = scene.focus.midX * CGFloat(canvasWidth)
    let focusY = scene.focus.midY * CGFloat(canvasHeight)
    let zoom = 1.0 + 0.035 * smooth(progress)
    let drift = (smooth(progress) - 0.5) * 16
    let imageWidth = CGFloat(canvasWidth) * zoom
    let imageHeight = CGFloat(canvasHeight) * zoom
    let imageX = (CGFloat(canvasWidth) - imageWidth) / 2 + (CGFloat(canvasWidth) / 2 - focusX) * 0.025 + drift
    let imageY = (CGFloat(canvasHeight) - imageHeight) / 2 + (CGFloat(canvasHeight) / 2 - focusY) * 0.025

    context.saveGState()
    context.setAlpha(alpha)
    context.interpolationQuality = .high
    context.draw(image, in: CGRect(x: imageX, y: imageY, width: imageWidth, height: imageHeight))
    context.restoreGState()

    let focusRect = rectFromTop(
        scene.focus.minX * CGFloat(canvasWidth),
        scene.focus.minY * CGFloat(canvasHeight),
        scene.focus.width * CGFloat(canvasWidth),
        scene.focus.height * CGFloat(canvasHeight)
    )
    context.saveGState()
    context.setAlpha(alpha * (0.20 + 0.14 * sin(progress * .pi * 2)))
    context.setLineWidth(2)
    context.setStrokeColor(color(0xC4B5FD, alpha: 0.92))
    context.stroke(focusRect.insetBy(dx: 1, dy: 1))
    context.restoreGState()

    let cursorProgress = smooth(clamp((progress - 0.12) / 0.54))
    let startX = scene.focus.minX * CGFloat(canvasWidth) - 70
    let startY = scene.focus.maxY * CGFloat(canvasHeight) + 42
    let cursorX = startX + (focusX - startX) * cursorProgress
    let cursorY = startY + (focusY - startY) * cursorProgress
    let cursorPoint = CGPoint(x: cursorX, y: CGFloat(canvasHeight) - cursorY)
    if progress > 0.48 {
        let pulse = CGFloat(9 + 8 * sin((progress - 0.48) * .pi * 5))
        context.saveGState()
        context.setAlpha(alpha * 0.46)
        context.setLineWidth(2)
        context.setStrokeColor(color(0x7C3AED))
        context.strokeEllipse(in: CGRect(x: cursorPoint.x - pulse, y: cursorPoint.y - pulse, width: pulse * 2, height: pulse * 2))
        context.restoreGState()
    }

    context.saveGState()
    context.setAlpha(alpha)
    context.setShadow(offset: CGSize(width: 1, height: -2), blur: 4, color: color(0x000000, alpha: 0.7))
    let pointer = CGMutablePath()
    pointer.move(to: cursorPoint)
    pointer.addLine(to: CGPoint(x: cursorPoint.x + 1, y: cursorPoint.y - 23))
    pointer.addLine(to: CGPoint(x: cursorPoint.x + 7, y: cursorPoint.y - 17))
    pointer.addLine(to: CGPoint(x: cursorPoint.x + 12, y: cursorPoint.y - 28))
    pointer.addLine(to: CGPoint(x: cursorPoint.x + 17, y: cursorPoint.y - 26))
    pointer.addLine(to: CGPoint(x: cursorPoint.x + 12, y: cursorPoint.y - 14))
    pointer.addLine(to: CGPoint(x: cursorPoint.x + 22, y: cursorPoint.y - 13))
    pointer.closeSubpath()
    context.addPath(pointer)
    context.setFillColor(color(0xffffff))
    context.fillPath()
    context.setStrokeColor(color(0x1F2937))
    context.setLineWidth(1.3)
    context.addPath(pointer)
    context.strokePath()
    context.restoreGState()

    context.saveGState()
    context.setAlpha(alpha)
    context.setFillColor(color(0x08090D, alpha: 0.90))
    context.fill(rectFromTop(0, 846, CGFloat(canvasWidth), 234))
    context.setFillColor(color(0x7C3AED))
    context.fill(rectFromTop(0, 846, 8, 234))
    drawText(scene.chapter, context: context, x: 74, y: 874, width: 520, height: 24, size: 14, weight: .semibold, colorHex: 0xC4B5FD)
    drawText(scene.title, context: context, x: 74, y: 906, width: 740, height: 48, size: 31, weight: .semibold)
    drawText(scene.caption, context: context, x: 74, y: 960, width: 1660, height: 70, size: 23, weight: .regular, colorHex: 0xE5E7EB)
    context.setFillColor(color(0xFFFFFF, alpha: 0.18))
    context.fill(rectFromTop(74, 1048, CGFloat(canvasWidth - 148), 3))
    context.setFillColor(color(0xA855F7))
    context.fill(rectFromTop(74, 1048, CGFloat(canvasWidth - 148) * CGFloat(progress), 3))
    context.restoreGState()
}

func sceneIndex(at time: Double) -> (index: Int, elapsed: Double) {
    var elapsed = time
    for (index, scene) in scenes.enumerated() {
        if elapsed < scene.duration || index == scenes.count - 1 {
            return (index, elapsed)
        }
        elapsed -= scene.duration
    }
    return (scenes.count - 1, scenes.last!.duration)
}

func renderFrame(time: Double, images: [CGImage], context: CGContext) {
    context.setFillColor(color(0x090A0F))
    context.fill(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
    let current = sceneIndex(at: time)
    let scene = scenes[current.index]
    let progress = CGFloat(current.elapsed / scene.duration)
    let blendStart = max(0, scene.duration - transitionDuration)

    if current.index + 1 < scenes.count && current.elapsed >= blendStart {
        let blend = smooth(CGFloat((current.elapsed - blendStart) / transitionDuration))
        drawScene(scene, image: images[current.index], progress: progress, alpha: 1 - blend, context: context)
        let next = scenes[current.index + 1]
        drawScene(next, image: images[current.index + 1], progress: 0, alpha: blend, context: context)
    } else {
        drawScene(scene, image: images[current.index], progress: progress, alpha: 1, context: context)
    }
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

func savePNG(image: CGImage, to url: URL) throws {
    let bitmap = NSBitmapImageRep(cgImage: image)
    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not encode poster PNG"])
    }
    try data.write(to: url, options: .atomic)
}

func renderStill(images: [CGImage], time: Double, outputURL: URL) throws {
    guard let context = CGContext(data: nil, width: canvasWidth, height: canvasHeight, bitsPerComponent: 8, bytesPerRow: canvasWidth * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue) else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not allocate poster canvas"])
    }
    renderFrame(time: time, images: images, context: context)
    guard let image = context.makeImage() else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not create poster image"])
    }
    try savePNG(image: image, to: outputURL)
}

func encodeSilentVideo(images: [CGImage], outputURL: URL) throws {
    try? FileManager.default.removeItem(at: outputURL)
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mov)
    let settings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: canvasWidth,
        AVVideoHeightKey: canvasHeight,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 12_000_000,
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
        throw NSError(domain: "TribesCapitalWalkthrough", code: 4, userInfo: [NSLocalizedDescriptionKey: "Video writer rejected H.264 input"])
    }
    writer.add(input)
    guard writer.startWriting() else {
        throw writer.error ?? NSError(domain: "TribesCapitalWalkthrough", code: 5, userInfo: [NSLocalizedDescriptionKey: "Could not start video writer"])
    }
    writer.startSession(atSourceTime: .zero)

    for frame in 0..<frameCount {
        while !input.isReadyForMoreMediaData {
            Thread.sleep(forTimeInterval: 0.003)
        }
        guard let pool = adaptor.pixelBufferPool else {
            throw NSError(domain: "TribesCapitalWalkthrough", code: 6, userInfo: [NSLocalizedDescriptionKey: "Video pixel-buffer pool is unavailable"])
        }
        var maybeBuffer: CVPixelBuffer?
        let result = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &maybeBuffer)
        guard result == kCVReturnSuccess, let pixelBuffer = maybeBuffer else {
            throw NSError(domain: "TribesCapitalWalkthrough", code: 7, userInfo: [NSLocalizedDescriptionKey: "Could not allocate frame \(frame)"])
        }
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        guard let context = makeContext(pixelBuffer: pixelBuffer) else {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
            throw NSError(domain: "TribesCapitalWalkthrough", code: 8, userInfo: [NSLocalizedDescriptionKey: "Could not draw frame \(frame)"])
        }
        renderFrame(time: Double(frame) / Double(frameRate), images: images, context: context)
        CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
        let presentationTime = CMTime(value: Int64(frame), timescale: frameRate)
        guard adaptor.append(pixelBuffer, withPresentationTime: presentationTime) else {
            throw writer.error ?? NSError(domain: "TribesCapitalWalkthrough", code: 9, userInfo: [NSLocalizedDescriptionKey: "Could not append frame \(frame)"])
        }
    }

    input.markAsFinished()
    let finished = DispatchSemaphore(value: 0)
    writer.finishWriting { finished.signal() }
    finished.wait()
    guard writer.status == .completed else {
        throw writer.error ?? NSError(domain: "TribesCapitalWalkthrough", code: 10, userInfo: [NSLocalizedDescriptionKey: "Video writer did not complete"])
    }
}

func muxAudio(videoURL: URL, audioURL: URL, outputURL: URL) throws {
    let composition = AVMutableComposition()
    let videoAsset = AVURLAsset(url: videoURL)
    let audioAsset = AVURLAsset(url: audioURL)
    let range = CMTimeRange(start: .zero, duration: CMTime(seconds: durationSeconds, preferredTimescale: 600))

    guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
          let destinationVideo = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 11, userInfo: [NSLocalizedDescriptionKey: "Rendered video track is missing"])
    }
    try destinationVideo.insertTimeRange(range, of: sourceVideo, at: .zero)

    guard let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
          let destinationAudio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 12, userInfo: [NSLocalizedDescriptionKey: "Original score track is missing"])
    }
    try destinationAudio.insertTimeRange(range, of: sourceAudio, at: .zero)

    try? FileManager.default.removeItem(at: outputURL)
    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 13, userInfo: [NSLocalizedDescriptionKey: "Could not create MP4 export session"])
    }
    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.timeRange = range
    exporter.shouldOptimizeForNetworkUse = true
    let finished = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously { finished.signal() }
    finished.wait()
    guard exporter.status == .completed else {
        throw exporter.error ?? NSError(domain: "TribesCapitalWalkthrough", code: 14, userInfo: [NSLocalizedDescriptionKey: "MP4 export did not complete"])
    }
}

func argument(after flag: String) -> String? {
    guard let index = CommandLine.arguments.firstIndex(of: flag), index + 1 < CommandLine.arguments.count else { return nil }
    return CommandLine.arguments[index + 1]
}

do {
    guard let outputPath = argument(after: "--output-dir") else {
        throw NSError(domain: "TribesCapitalWalkthrough", code: 15, userInfo: [NSLocalizedDescriptionKey: "Usage: swift walkthrough.swift --output-dir <path> [--audio <score.wav>] [--poster-only] [--poster-time <seconds>]"])
    }
    let outputDirectory = URL(fileURLWithPath: outputPath, isDirectory: true)
    try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
    let images = try scenes.map { scene -> CGImage in
        let imageURL = outputDirectory.appendingPathComponent(scene.image)
        guard let image = NSImage(contentsOf: imageURL)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            throw NSError(domain: "TribesCapitalWalkthrough", code: 16, userInfo: [NSLocalizedDescriptionKey: "Could not load production capture \(scene.image)"])
        }
        return image
    }

    let posterTime = Double(argument(after: "--poster-time") ?? "24") ?? 24
    let posterURL = outputDirectory.appendingPathComponent("walkthrough-poster.png")
    try renderStill(images: images, time: posterTime, outputURL: posterURL)
    print("Poster rendered: \(posterURL.path)")

    if !CommandLine.arguments.contains("--poster-only") {
        guard let audioPath = argument(after: "--audio") else {
            throw NSError(domain: "TribesCapitalWalkthrough", code: 17, userInfo: [NSLocalizedDescriptionKey: "Full render requires --audio <score.wav>"])
        }
        let silentURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("tribes-capital-walkthrough-visual.mov")
        let finalURL = outputDirectory.appendingPathComponent("tribescapital-production-walkthrough.mp4")
        try encodeSilentVideo(images: images, outputURL: silentURL)
        print("Visual render complete; muxing original score...")
        try muxAudio(videoURL: silentURL, audioURL: URL(fileURLWithPath: audioPath), outputURL: finalURL)
        try? FileManager.default.removeItem(at: silentURL)
        print("MP4 rendered: \(finalURL.path)")
    }
} catch {
    fputs("Render failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}