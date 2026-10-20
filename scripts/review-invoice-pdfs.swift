// macOS-only local QA, not a production runtime dependency.
// swift scripts/review-invoice-pdfs.swift OUTPUT_DIR INPUT.pdf [...]
// Render every page through Apple PDFKit (same engine as Preview) and export
// extracted text/line geometry. Use synthetic PDFs, never customer documents.
import Foundation
import AppKit
import PDFKit

let arguments = CommandLine.arguments
if arguments.count < 3 {
    fputs("Usage: swift scripts/review-invoice-pdfs.swift OUTPUT_DIR INPUT.pdf [...]\n", stderr)
    exit(1)
}
let output = URL(fileURLWithPath: arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
var documents: [[String: Any]] = []
for input in arguments.dropFirst(2) {
    let url = URL(fileURLWithPath: input)
    guard let document = PDFDocument(url: url) else { fatalError("Cannot read synthetic PDF: \(input)") }
    let name = url.deletingPathExtension().lastPathComponent
    var pages: [[String: Any]] = []
    var text = ""
    for index in 0..<document.pageCount {
        guard let page = document.page(at: index) else { fatalError("Missing page") }
        let bounds = page.bounds(for: .mediaBox)
        let image = page.thumbnail(of: NSSize(width: bounds.width * 2, height: bounds.height * 2), for: .mediaBox)
        guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) else { fatalError("PDFKit render failed") }
        try png.write(to: output.appendingPathComponent("\(name)-page-\(index + 1).png"))
        let pageText = page.string ?? ""
        text += "--- PAGE \(index + 1) ---\n\(pageText)\n"
        let utf16 = pageText as NSString
        var offset = 0
        var lines: [[String: Any]] = []
        for value in pageText.components(separatedBy: "\n") {
            let length = (value as NSString).length
            if length > 0, offset + length <= utf16.length, let selection = page.selection(for: NSRange(location: offset, length: length)) {
                let rect = selection.bounds(for: page)
                lines.append(["text": value, "x": rect.minX, "y": rect.minY, "width": rect.width, "height": rect.height])
            }
            offset += length + 1
        }
        pages.append(["page": index + 1, "width": bounds.width, "height": bounds.height, "lines": lines])
    }
    try text.write(to: output.appendingPathComponent("\(name).txt"), atomically: true, encoding: .utf8)
    documents.append(["name": name, "pages": pages])
}
let json = try JSONSerialization.data(withJSONObject: documents, options: [.prettyPrinted, .sortedKeys])
try json.write(to: output.appendingPathComponent("geometry.json"))
print("PDFKit rendered \(documents.count) synthetic documents; text and geometry exported to \(output.path)")
