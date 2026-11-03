// Outlines of a text in a font as SVG path data, one entry per character (CoreText, macOS only), for
// tools/make-monogram.mjs. Variable fonts get the axes passed as tag=value (e.g. wght=800 opsz=96).
//
// Aufruf:  swift tools/lib/glyphs.swift <font.ttf> <text> [wght=800 opsz=96 …]
// Ausgabe: JSON { "ascent", "descent", "width", "glyphs": [{ "char", "d" }] } in font units of a 1000 px font
import CoreText
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else { FileHandle.standardError.write("usage: glyphs.swift <font> <text> [tag=value …]\n".data(using: .utf8)!); exit(2) }
let url = URL(fileURLWithPath: args[1]) as CFURL
guard let descs = CTFontManagerCreateFontDescriptorsFromURL(url) as? [CTFontDescriptor], let base = descs.first else {
  FileHandle.standardError.write("font not readable: \(args[1])\n".data(using: .utf8)!); exit(1)
}
func tag(_ s: String) -> Int { s.unicodeScalars.reduce(0) { ($0 << 8) | Int($1.value) } }
var axes: [NSNumber: NSNumber] = [:]
for a in args.dropFirst(3) {
  let kv = a.split(separator: "=")
  if kv.count == 2, let v = Double(kv[1]) { axes[NSNumber(value: tag(String(kv[0])))] = NSNumber(value: v) }
}
let desc = CTFontDescriptorCreateCopyWithAttributes(base, [kCTFontVariationAttribute: axes] as CFDictionary)
let font = CTFontCreateWithFontDescriptor(desc, 1000, nil)
let text = args[2]
let line = CTLineCreateWithAttributedString(NSAttributedString(string: text, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font]))
let ascent = CTFontGetAscent(font), descent = CTFontGetDescent(font)
let chars = Array(text.utf16)
var out: [[String: String]] = []
func f(_ v: CGFloat) -> String { String(format: "%.1f", v).replacingOccurrences(of: ".0", with: "") }
for run in CTLineGetGlyphRuns(line) as! [CTRun] {
  let n = CTRunGetGlyphCount(run)
  var glyphs = [CGGlyph](repeating: 0, count: n), pos = [CGPoint](repeating: .zero, count: n), idx = [CFIndex](repeating: 0, count: n)
  CTRunGetGlyphs(run, CFRange(location: 0, length: n), &glyphs)
  CTRunGetPositions(run, CFRange(location: 0, length: n), &pos)
  CTRunGetStringIndices(run, CFRange(location: 0, length: n), &idx)
  let runFont = (CTRunGetAttributes(run) as NSDictionary)[kCTFontAttributeName as String] as! CTFont
  for i in 0..<n {
    // y down, baseline at the ascent
    var t = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: pos[i].x, ty: ascent - pos[i].y)
    guard let path = CTFontCreatePathForGlyph(runFont, glyphs[i], &t) else { continue }
    var d = ""
    path.applyWithBlock { e in
      let p = e.pointee.points
      switch e.pointee.type {
      case .moveToPoint: d += "M\(f(p[0].x)) \(f(p[0].y))"
      case .addLineToPoint: d += "L\(f(p[0].x)) \(f(p[0].y))"
      case .addQuadCurveToPoint: d += "Q\(f(p[0].x)) \(f(p[0].y)) \(f(p[1].x)) \(f(p[1].y))"
      case .addCurveToPoint: d += "C\(f(p[0].x)) \(f(p[0].y)) \(f(p[1].x)) \(f(p[1].y)) \(f(p[2].x)) \(f(p[2].y))"
      case .closeSubpath: d += "Z"
      @unknown default: break
      }
    }
    out.append(["char": String(utf16CodeUnits: [chars[idx[i]]], count: 1), "d": d])
  }
}
let json: [String: Any] = ["ascent": Double(ascent), "descent": Double(descent), "width": Double(CTLineGetTypographicBounds(line, nil, nil, nil)), "glyphs": out]
print(String(data: try! JSONSerialization.data(withJSONObject: json), encoding: .utf8)!)
