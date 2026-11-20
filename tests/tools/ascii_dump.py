import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from check import read_png

PNG = sys.argv[1]
y0, y1, x0, x1 = (int(v) for v in sys.argv[2:6])
sx, sy = (int(v) for v in sys.argv[6:8])

w, h, ch, px = read_png(PNG)

def lum(x, y):
    i = (y * w + x) * ch
    return (px[i] * 3 + px[i + 1] * 6 + px[i + 2]) / 10.0

ramp = ' .:-=+*#%@'
print(PNG.split('/')[-1], 'y%d..%d x%d..%d' % (y0, y1, x0, x1))
for y in range(y0, min(y1, h), sy):
    line = ''
    for x in range(x0, min(x1, w), sx):
        tot = 0
        n = 0
        for yy in range(y, min(y + sy, h)):
            for xx in range(x, min(x + sx, w)):
                tot += lum(xx, yy)
                n += 1
        v = tot / n
        line += ramp[min(len(ramp) - 1, int(v / 255 * len(ramp) * 1.9))]
    print('|' + line + '|')