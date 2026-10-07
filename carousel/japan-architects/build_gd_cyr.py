"""Add uppercase Cyrillic to GoodDog Plain by composing its own Latin glyphs.
Output: GoodDogCyr.ttf (personal-use derivative of Fonthead's freeware GoodDog)."""
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.reverseContourPen import ReverseContourPen

f = TTFont('gd1/GOODDP__.TTF')
cm = f.getBestCmap(); G = f['glyf']; gs = f.getGlyphSet(); hmtx = f['hmtx']
for tag in ('fpgm', 'prep', 'cvt ', 'hdmx'):
    if tag in f: del f[tag]
for n in G.keys():
    gl = G[n]
    if hasattr(gl, 'program'): gl.program = None
    if hasattr(gl, 'removeHinting'): gl.removeHinting()
name = lambda ch: cm[ord(ch)]
def bbox(ch):
    g = G[name(ch)]; g.recalcBounds(G); return g.xMin, g.yMin, g.xMax, g.yMax

def part(ch, box, mirror=False, flip=False, rot=0):
    """Map glyph ch's bbox onto box=(x0,y0,x1,y1); mirror=horizontal, flip=vertical, rot=90 CCW."""
    x0, y0, x1, y1 = bbox(ch); X0, Y0, X1, Y1 = box
    if rot == 90:   # (x,y)->(-y,x) then fit
        sw, sh = (y1 - y0), (x1 - x0)
        sx, sy = (X1 - X0) / sw, (Y1 - Y0) / sh
        # x' = X1 - (y - y0)*sx ; y' = Y0 + (x - x0)*sy
        return name(ch), (0, sy, -sx, 0, X1 + y0 * sx, Y0 - x0 * sy)
    sx = (X1 - X0) / (x1 - x0); sy = (Y1 - Y0) / (y1 - y0)
    a, dx = (-sx, X1 + x0 * sx) if mirror else (sx, X0 - x0 * sx)
    d, dy = (-sy, Y1 + y0 * sy) if flip else (sy, Y0 - y0 * sy)
    return name(ch), (a, 0, 0, d, dx, dy)

def make(gname, parts, adv):
    pen = TTGlyphPen(gs)
    for src, (a, b, c, d, e, ff) in parts:
        det = a * d - b * c
        tp = TransformPen(pen, (a, b, c, d, e, ff))
        gs[src].draw(ReverseContourPen(tp) if det < 0 else tp)
    G[gname] = pen.glyph(); G[gname].recalcBounds(G)
    hmtx[gname] = (adv, max(0, G[gname].xMin if G[gname].numberOfContours else 0))
    f.getGlyphOrder().append(gname) if gname not in f.getGlyphOrder() else None

T, B = 620, 20   # cap top / baseline
alias = {'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','Х':'X','У':'Y'}
new = {
 'Г': ([part('L', (20, B, 380, T), flip=True)], 400),
 'Д': ([part('V', (70, B+110, 400, T), flip=True), part('-', (20, B+40, 450, B+130)),
        part('I', (20, B-110, 80, B+80)), part('I', (390, B-110, 450, B+80))], 470),
 'Ж': ([part('X', (10, B, 560, T)), part('I', (220, B, 350, T))], 570),
 'З': ([part('3', (20, B, 360, T))], 380),
 'И': ([part('N', (20, B, 380, T), mirror=True)], 400),
 'Й': ([part('N', (20, B, 380, T), mirror=True), part('~', (110, T+40, 300, T+120))], 400),
 'Л': ([part('V', (15, B, 420, T), flip=True)], 435),
 'П': ([part('U', (20, B, 460, T), flip=True)], 480),
 'Ф': ([part('O', (20, B+90, 470, T-60)), part('I', (180, B-30, 310, T+30))], 490),
 'Ц': ([part('U', (20, B+20, 440, T)), part('I', (375, B-140, 455, B+160))], 470),
 'Ч': ([part('h', (20, B, 380, T), mirror=True, flip=True)], 400),
 'Ш': ([part('I', (20, B, 140, T)), part('I', (230, B, 350, T)), part('I', (440, B, 560, T)),
        part('-', (20, B-10, 560, B+80))], 580),
 'Щ': ([part('I', (20, B, 140, T)), part('I', (230, B, 350, T)), part('I', (440, B, 560, T)),
        part('-', (20, B-10, 600, B+80)), part('I', (540, B-120, 610, B+60))], 620),
 'Ь': ([part('b', (20, B, 400, T))], 410),
 'Ъ': ([part('-', (10, T-90, 170, T)), part('b', (120, B, 500, T))], 510),
 'Ы': ([part('b', (20, B, 380, T)), part('I', (400, B, 520, T))], 540),
 'Э': ([part('C', (20, B, 440, T), mirror=True), part('-', (140, (B+T)//2-45, 400, (B+T)//2+45))], 460),
 'Ю': ([part('I', (20, B, 140, T)), part('-', (110, (B+T)//2-40, 230, (B+T)//2+40)), part('O', (200, B+20, 560, T-20))], 580),
 'Я': ([part('R', (20, B, 420, T), mirror=True)], 440),
 'Ё': ([part('E', (20, B, 370, T-40)), part('.', (80, T+10, 160, T+90)), part('.', (230, T+10, 310, T+90))], 390),
 'Б': ([part('b', (20, B, 400, T)), part('-', (60, T-90, 420, T))], 430),
}
cmap = {}
for cp, parts, adv in [(0x2014, [part('-', (10, 250, 690, 340))], 700), (0x2013, [part('-', (10, 250, 440, 340))], 450),
                       (0x00B7, [part('.', (40, 270, 130, 360))], 170)]:
    g = 'x_' + format(cp, '04X'); make(g, parts, adv); cmap[cp] = g
for ch, src in alias.items(): cmap[ord(ch)] = name(src)
for ch, (parts, adv) in new.items():
    g = 'cyr_' + format(ord(ch), '04X'); make(g, parts, adv); cmap[ord(ch)] = g
for ch in list(cmap): cmap[ch + 0x20 if ch != 0x401 else 0x451] = cmap[ch]   # lowercase -> same shapes
for t in f['cmap'].tables:
    if t.isUnicode(): t.cmap.update(cmap)
f['maxp'].numGlyphs = len(f.getGlyphOrder())
for rec in f['name'].names:
    if rec.nameID in (1, 3, 4, 6):
        s = rec.toUnicode().replace('GoodDog Plain', 'GoodDog Cyr').replace('GoodDogPlain', 'GoodDogCyr')
        rec.string = s
f.save('GoodDogCyr.ttf'); print('saved', len(cmap), 'cyrillic code points')
