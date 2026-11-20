import sys
d = open(sys.argv[1] if len(sys.argv) > 1 else 'lay_crop.pgm', 'rb').read()
parts = d.split(b'\n', 3)
w, h = map(int, parts[1].split())
px = parts[3]
step = len(px) // (w * h)
bits, cw = 14, 16
vals = []
for i in range(16):
    v = 0
    for b in range(bits):
        x = b * cw + cw // 2
        y = i * cw + cw // 2
        if px[(y * w + x) * step] < 128:
            v |= 1 << b
    vals.append(v)

names = ['innerWidth', 'scrollWidth', 'scrollHeight', 'hero1.w', 'hero2.w', 'hero2.left',
         'card1.w', 'card3.right', 'days/row', 'yearStrip', 'tzolkin', 'moonSvg.w',
         'wheel.w', 'calCard.w', 'today', 'overflows']
for n, v in zip(names, vals):
    print(f'{n:14s} {v}')
