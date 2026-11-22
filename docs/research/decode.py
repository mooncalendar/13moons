import zlib, struct, sys

def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos = 8
    w = h = bitdepth = colortype = None
    idat = b''
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos+4])[0]
        typ = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+ln]
        if typ == b'IHDR':
            w, h, bitdepth, colortype = struct.unpack('>IIBB', chunk[:10])
        elif typ == b'IDAT':
            idat += chunk
        elif typ == b'IEND':
            break
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0:1, 2:3, 3:1, 4:2, 6:4}[colortype]
    bpp = ch * bitdepth // 8
    stride = (w * ch * bitdepth + 7) // 8
    out = bytearray()
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        if f == 1:
            for i in range(bpp, stride): line[i] = (line[i] + line[i-bpp]) & 255
        elif f == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i-bpp] if i >= bpp else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out += line
        prev = line
    return w, h, ch, bytes(out)

w, h, ch, px = read_png(sys.argv[1] if len(sys.argv) > 1 else 'bar.png')
print('image', w, 'x', h, 'channels', ch)

cw, bits = 20, 12
rows = 14
vals = []
for i in range(rows):
    v = 0
    for b in range(bits):
        x = b*cw + cw//2
        y = i*cw + cw//2
        o = (y*w + x)*ch
        dark = px[o] < 128
        if dark:
            v |= 1 << b
    vals.append(v)

want = [34, 86, 31, 31, 207, 0, 5, 6, 22, 229, 3401, 180, 12, 30]
labels = ['kin 1987-07-26', 'kin 2026-11-20', 'kin 2028-02-29', 'kin 2028-02-28',
          'kin 2012-12-21', 'moon 2026-07-25 (DFT)', 'moon 2026-11-20', 'day 2026-11-20',
          'day 2028-02-29', 'kin bearer 2026', 'lon*1000 2026-11-20', 'elong full moon',
          'constel idx 3.39deg', 'days Nov 2026']
ok = True
for lab, got, wv in zip(labels, vals, want):
    st = 'OK' if got == wv else 'FAIL'
    if got != wv: ok = False
    print(f'{st}  {lab:26s} got {got:6d}  want {wv}')
print('ALL OK' if ok else 'SOME FAILED')
