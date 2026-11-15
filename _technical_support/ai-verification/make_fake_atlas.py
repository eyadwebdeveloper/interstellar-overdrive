"""Builds a small stand-in atlas in the Human-Atlas binary format so the 3D code paths
(framing, dark stage, pinned AI labels, view buttons) can be tested without the 70 MB models.
Output goes to ./fake-models and is served by smoke_atlas.py via request interception. Never shipped in public/."""
import gzip, json, os
import numpy as np

OUT = os.path.join(os.path.dirname(__file__), "fake-models")
os.makedirs(OUT, exist_ok=True)

def ellipsoid(c, r, n=18):
    u = np.linspace(0, np.pi, n); v = np.linspace(0, 2*np.pi, n*2)
    uu, vv = np.meshgrid(u, v, indexing="ij")
    x = np.sin(uu)*np.cos(vv); y = np.cos(uu); z = np.sin(uu)*np.sin(vv)
    nrm = np.stack([x/r[0], y/r[1], z/r[2]], -1).reshape(-1, 3)
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)
    pos = np.stack([c[0]+r[0]*x, c[1]+r[1]*y, c[2]+r[2]*z], -1).reshape(-1, 3)
    idx = []
    W = v.size
    for i in range(n-1):
        for j in range(W-1):
            a = i*W+j; b = a+1; c2 = a+W; d = c2+1
            idx += [a, c2, b, b, c2, d]
    return pos.astype("<f4"), nrm, np.array(idx, "<u4")

def capsule(a, b, r):
    a = np.array(a); b = np.array(b)
    c = (a+b)/2; h = np.linalg.norm(b-a)/2 + r
    return ellipsoid(c, (r, h, r))  # vertical limbs only

SPEC = {  # system -> list of (name, geometry)
 "integumentary": [("skin torso", ellipsoid((0,1.25,0),(0.19,0.36,0.11))), ("skin head", ellipsoid((0,1.7,0),(0.1,0.13,0.1))),
                   ("skin hips", ellipsoid((0,0.92,0),(0.17,0.14,0.1)))] +
                  [(f"skin leg {s}", capsule((s*.09,.1,0),(s*.09,.85,0),.075)) for s in (-1,1)] +
                  [(f"skin arm {s}", capsule((s*.27,.95,0),(s*.24,1.5,0),.045)) for s in (-1,1)],
 "skeletal": [("skull", ellipsoid((0,1.7,0),(0.085,0.11,0.09))), ("sternum", ellipsoid((0,1.36,0.07),(0.02,0.13,0.015))),
              ("spine", ellipsoid((0,1.2,-0.05),(0.02,0.38,0.025))), ("pelvis", ellipsoid((0,0.9,0),(0.14,0.07,0.07)))] +
             [(f"rib {i}{s}", ellipsoid((s*.07,1.48-i*.045,.01),(0.1,0.01,0.07))) for i in range(6) for s in (-1,1)] +
             [(f"femur {s}", capsule((s*.09,.5,0),(s*.09,.86,0),.02)) for s in (-1,1)] +
             [(f"tibia {s}", capsule((s*.09,.08,0),(s*.09,.46,0),.017)) for s in (-1,1)] +
             [(f"humerus {s}", capsule((s*.26,1.2,0),(s*.25,1.5,0),.014)) for s in (-1,1)],
 "muscular": [(f"pec {s}", ellipsoid((s*.08,1.4,.07),(0.09,0.06,0.04))) for s in (-1,1)] +
             [(f"quad {s}", capsule((s*.09,.5,.02),(s*.09,.85,.02),.05)) for s in (-1,1)],
 "cardiac": [("heart", ellipsoid((0.03,1.33,0.05),(0.05,0.065,0.045)))],
 "brain": [("brain", ellipsoid((0,1.71,0),(0.07,0.075,0.085)))],
 "nervous": [("spinal cord", ellipsoid((0,1.15,-0.05),(0.008,0.35,0.008)))],
 "arterial": [("aorta", ellipsoid((0,1.15,0),(0.012,0.3,0.012)))],
 "venous": [("vena cava", ellipsoid((0.03,1.1,0),(0.014,0.3,0.014)))],
 "respiratory": [(f"lung {s}", ellipsoid((s*.09,1.32,0),(0.07,0.13,0.07))) for s in (-1,1)],
 "digestive": [("stomach", ellipsoid((-0.05,1.1,0.05),(0.06,0.05,0.05))), ("liver", ellipsoid((0.08,1.12,0.05),(0.09,0.05,0.05)))],
 "urinary": [(f"kidney {s}", ellipsoid((s*.06,1.05,-0.03),(0.025,0.04,0.02))) for s in (-1,1)],
 "lymphatic": [("neck nodes", ellipsoid((0,1.55,0.04),(0.03,0.012,0.012))), ("groin nodes", ellipsoid((0,0.84,0.07),(0.05,0.012,0.012))),
               ("axillary nodes", ellipsoid((0.17,1.4,0),(0.012,0.012,0.012)))],
}

parts, chunks, concepts = [], [], []
tri = 0
for ci, (sysid, items) in enumerate(SPEC.items()):
    buf = bytearray()
    for name, (pos, nrm, idx) in items:
        pid = f"{sysid}-{len(parts)}"
        po = len(buf); buf += pos.tobytes()
        no = len(buf); buf += (nrm*32767).astype("<i2").tobytes()
        while len(buf) % 4: buf += b"\0"
        io = len(buf); buf += idx.tobytes()
        parts.append(dict(id=pid, name=name, conceptId=pid, system=sysid, chunk=ci, positions=po, normals=no, indices=io,
                          vertexCount=len(pos), indexCount=len(idx), bounds=[pos.min(0).tolist(), pos.max(0).tolist()]))
        concepts.append(dict(id=pid, name=name, elements=[pid])); tri += len(idx)//3
    raw = bytes(buf)
    open(f"{OUT}/atlas-{ci}.bin", "wb").write(raw)
    gz = gzip.compress(raw)
    open(f"{OUT}/atlas-{ci}.bin.gz", "wb").write(gz)
    chunks.append(dict(url=f"/models/atlas-{ci}.bin", bytes=len(raw), gzip=f"/models/atlas-{ci}.bin.gz", gzipBytes=len(gz)))
json.dump(dict(version="test", parts=parts, concepts=concepts, chunks=chunks, triangles=tri), open(f"{OUT}/atlas.json", "w"))
print("parts", len(parts), "chunks", len(chunks))
