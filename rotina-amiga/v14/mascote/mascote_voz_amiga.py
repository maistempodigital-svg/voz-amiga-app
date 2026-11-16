# -*- coding: utf-8 -*-
"""Mascote OFICIAL do Voz Amiga — arquivo único e autossuficiente (arte original embutida).
Gerado da skill mascote-voz-amiga. NÃO redesenhar: as peças abaixo são recortes da arte oficial.
Uso: from mascote_voz_amiga import mascote, salvar_pose, POSES"""
import base64, io, math
from PIL import Image, ImageDraw

_DADOS = {
    "corpo": ((540, 532), (33, 100), (
        "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"
        "w/R9W9+9SCzzZl0ACkRil3fqAuhzqRIU0UChRdwKBb7eUiUMerZyFeIebxGTHkSZItP9U2rNAwDrEHebRbZ5LmgtyLWLuRLZ4DGt"
        "FSFXfTJ/byJriVuhKgeeFQmFPxel4UtkLnBDxP3LcmWeEgmF/LmgGX8iC2u3eXzFKoBSiZA/Ec5hHjvbH6WU4TE33ei+tYvkcYF8"
        "F/1bAVZQOCAsLgAA8PEAnQEqkQGwAT4pFIdCoaEKBZpcDAFCU3cGCy5A6P+B8yLrDRP+b/xf7Rf3b/sf7b5x7d/c/v3/cv+v/jfv"
        "T/jeUXyHkicwf5n+8/ub/jP///4vtX/x/+X+TPzP/RX/X9wf9SP9J/av8v/1f9V///na9hX7vepL+r/6v9q/dd/4X/Z/4fvO/qv+"
        "o/aT4Ef5J/m//32Pf989Tj+i/9305v2t+I39sv209p3/t5sJ+L/mb+33MW0BzGP5VkG+aGhb/T8sp8Bdt76m/ajzZeSY+5+ob/M/"
        "8b6sn+N/5PRL+Vf7L2Fv5l/bOrx6D361//8qqT3Xzs94g3uOat6sl6LwKNMWBz5W4J2bv+kusN4sT7XrnIJzbAAVJUxsWJV79MYJ"
        "0XB09l9PIh+RwUz6Nh7Vne6Rjq3RR6XPLjMu97apy4bkBbZ5LOXDfu8QNDKDknnkxP25URc2D7qSPoRygKZrOCpsv//Q7NHv1Lmp"
        "wzZjQTT3QHkoL0isKwspfnM4T2Mac2oaGXwqmMlOGM0OkMbnbyVZuqfyVk41rgxc6r0Prq37ouWlDJzX62ffZIrUpGh/ldtaVckV"
        "OIjpFwK/rq38nKCwBENdJb6Vb20qGVJD9VCX+LCplqLtcnuz8aSpb7ge6rOh85NubgGOuXyfHYCTyZ0bTzQa9+l1772GWRImXqq/"
        "BdAvEhXxGAKocmV263DHr2AqbFZNr4k1TM2mzPH3cXb5pMfPP5UD1EH4j50Z4FBjlZx6pc9vocOxo3CdVRZw4eHRhGl2f3owQ/KJ"
        "bjw6d+MhSDlOSWbBm66gPo5SmKDe2oyBkD0CA/6pG9PBfDK7d5MTgseefh7xqaYJFDXjCZapS5YmRqUBmhs08Kq6jmgQvUDP2gDX"
        "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"
    )),
    "braco": ((540, 488), (370, 237), (
        "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"
    )),
    "antenas": ((540, 488), (96, 27), (
        "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"
    )),
    "olho": ((540, 488), (103, 184), (
        "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"
        "F2VhIAA="
    )),
    "boca": ((540, 488), (163, 270), (
        "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"
        "tU0TqgAA"
    )),
}

_CONFERE = {'corpo': 'a1b6506896039bf9', 'braco': '29342f12b6b37da1', 'antenas': 'c9cc68c3c259ec26', 'olho': '85808e3ab0f45cb8', 'boca': 'b49ae08d91b89610'}


def _peca(nome):
    import hashlib
    (w, h), (x, y), b64 = _DADOS[nome]
    bruto = base64.b64decode("".join(b64))
    if hashlib.sha256(bruto).hexdigest()[:16] != _CONFERE[nome]:
        raise ValueError("Arte do mascote corrompida na copia (peca '%s'). Use o arquivo oficial "
                         "marca/mascote/mascote_voz_amiga.py do repositorio maistempodigital-svg/voz-amiga-instagram." % nome)
    parte = Image.open(io.BytesIO(bruto)).convert("RGBA")
    tela = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tela.alpha_composite(parte, (x, y))
    return tela

PAD = 70
PAD = 70
_P = {n: _peca(n) for n in ["corpo", "braco", "antenas", "olho", "boca"]}
CW, CH = 540 + 2 * PAD, 532 + 2 * PAD
ARM_PIVOT = (372 + PAD, 338 + PAD)
JOINT = (238, 101, 4)
# antenas separadas (x0, x1)
_ANT = []
for x0, x1 in [(90, 140), (155, 205), (220, 275)]:
    a = _P["antenas"].crop((x0, 20, x1, 100))
    _ANT.append((a, x0, 20))
_EYE = _P["olho"].crop((98, 180, 166, 266))
_MOUTH = _P["boca"].crop((158, 266, 238, 318))
_cache = {}


def _rot(im, ang, pivot):
    return im.rotate(ang, resample=Image.BICUBIC, center=pivot)


def mascote(size=500, t=0.0, fala=0.0, piscar=0.0, braco=0.0, incl=0.0, squash=0.0, olhar=(0, 0), piscadinha=0.0, **_):
    """size: largura final; fala 0..1; piscar 0..1; braco: graus (+ sobe/acena para trás, - aponta para frente);
    incl: inclinação do corpo em graus (+ anti-horário); squash: -1..1 (achata/estica)."""
    cv = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    # braço (atrás do corpo na junta)
    arm = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    arm.alpha_composite(_P["braco"], (PAD, PAD))
    arm = _rot(arm, braco, ARM_PIVOT)
    cv.alpha_composite(_P["corpo"], (PAD, PAD))
    d = ImageDraw.Draw(cv)
    px, py = ARM_PIVOT
    d.ellipse((px - 20, py - 18, px + 12, py + 18), fill=JOINT)
    cv.alpha_composite(arm)
    # dois olhos abertos (cópia do olho da arte), olhando para os lados e piscando juntos
    ox, oy = 7 * max(-1, min(1, olhar[0])), 5 * max(-1, min(1, olhar[1]))
    for i, ex0 in enumerate((98, 236)):
        fechado = piscar if not (i == 1 and piscadinha > 0.5) else 1.0
        k = 1 - fechado
        cx, cy = ex0 + 34 + PAD + ox, 223 + PAD + oy
        if k > 0.3:
            e = _EYE.resize((_EYE.width, max(2, int(_EYE.height * k))), Image.BICUBIC)
            cv.alpha_composite(e, (int(cx - 34), int(cy - e.height / 2)))
        else:   # olho fechado: arquinho igual ao da piscadinha original
            d.arc((cx - 26, cy - 14, cx + 26, cy + 24), 200, 340, fill=(20, 16, 20), width=9)
    # boca (abre/fecha esticando para baixo a partir do topo)
    s = 0.5 + 0.8 * max(0.0, min(1.0, fala))
    m = _MOUTH.resize((_MOUTH.width, max(2, int(_MOUTH.height * s))), Image.BICUBIC)
    cv.alpha_composite(m, (158 + PAD, 266 + PAD))
    # antenas balançando
    for i, (a, x0, y0) in enumerate(_ANT):
        ang = 9 * math.sin(t * 7 + i * 1.7)
        bob = 4 * math.sin(t * 9 + i)
        ra = a.rotate(ang, resample=Image.BICUBIC, expand=True)
        cv.alpha_composite(ra, (int(x0 + PAD + (a.width - ra.width) / 2), int(y0 + PAD + bob + (a.height - ra.height) / 2)))
    # estica-e-encolhe e inclinação
    if abs(squash) > 0.01:
        sx, sy = 1 + 0.10 * squash, 1 - 0.10 * squash
        nw, nh = int(CW * sx), int(CH * sy)
        sq = cv.resize((nw, nh), Image.BICUBIC)
        cv = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        cv.alpha_composite(sq.crop((max(0, (nw - CW) // 2), max(0, nh - CH), max(0, (nw - CW) // 2) + min(nw, CW), max(0, nh - CH) + min(nh, CH))),
                           (max(0, (CW - nw) // 2), max(0, CH - nh)))
    if abs(incl) > 0.1:
        cv = cv.rotate(incl, resample=Image.BICUBIC, center=(CW / 2, CH / 2))
    sc = size / 540
    return cv.resize((int(CW * sc), int(CH * sc)), Image.LANCZOS)



# Poses prontas (mesmas da folha de referência oficial)
POSES = {
    "neutro": dict(),
    "falando": dict(fala=1),
    "acenando": dict(braco=25, fala=0.4),
    "piscadinha": dict(piscadinha=1, fala=0.3),
    "apontando": dict(braco=-30, incl=8, olhar=(-1, 0)),
    "feliz": dict(piscar=1, fala=0.8),
}


def salvar_pose(caminho, pose="neutro", tamanho=540, fundo=None):
    """Salva o mascote em PNG. fundo=None deixa transparente; ou uma cor (r, g, b)."""
    m = mascote(tamanho, t=0.0, **POSES[pose])
    m = m.crop(m.getbbox())
    if fundo:
        f = Image.new("RGBA", m.size, tuple(fundo) + (255,)); f.alpha_composite(m); m = f
    m.save(caminho)
    return caminho


def boca_pelo_audio(caminho_wav, fps=30):
    """Lista 0..1 (um valor por quadro) para usar em fala=, sincronizando a boca com a voz."""
    import numpy as np, soundfile as sf
    a, sr = sf.read(caminho_wav)
    if a.ndim > 1: a = a.mean(1)
    hop = sr // fps
    e = np.array([np.sqrt(np.mean(a[k*hop:(k+1)*hop] ** 2) + 1e-9) for k in range(len(a)//hop + 1)])
    return list(np.clip(e / (np.percentile(e, 95) + 1e-6), 0, 1))


if __name__ == "__main__":
    import sys
    for p in POSES:
        salvar_pose(f"mascote_{p}.png", p)
    print("PNGs salvos:", ", ".join(POSES))
