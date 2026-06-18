#!/usr/bin/env python3
"""build-brain.py — compile the Touchstone Brain (YAML) into the JSON the Figma
audit plugin fetches from GitHub Pages.

The plugin (figma-plugin) is a pure JSON consumer: it never parses YAML. This
script reads the Brain YAML source and writes flat JSON into ../brain/, which
GitHub Pages serves at https://pixelslayer81.github.io/express-relay/brain/<name>.json
(with `Access-Control-Allow-Origin: *`, so the sandbox fetch works cross-origin).

Outputs (in ../brain/):
  _template-guidance.json   base skin tokens (colors, typography, logo)
  <brand>.json              one per brand dir with a tokens.yaml (azure, m365-copilot, …)
  compliance.json           score weights, pass threshold, severity, fix suggestions
  typography-scale.json     shared type scale + size tolerance
  catalog.json              template structural contract (node_specs, zones, verify_rules)
  brains.json               { "brands": [ {slug, label}, … ] } — the Audit-tab picker list

Usage:
  python build-brain.py [BRAIN_SRC]
    BRAIN_SRC defaults to the sibling Touchstone Brain folder; pass a path to override.

Run manually after editing the Brain, then commit & push the express-relay repo so
GitHub Pages republishes. The plugin caches per session, so reload the plugin to pick
up changes.
"""
import json
import os
import sys

import yaml

_HERE = os.path.dirname(os.path.abspath(__file__))
# express-relay/scripts -> express-relay/brain
OUT_DIR = os.path.normpath(os.path.join(_HERE, "..", "brain"))
# Default Brain source: ...\Claude\Claude_agent\Brain (sibling project of Claude_Templete)
DEFAULT_SRC = os.path.normpath(
    os.path.join(_HERE, "..", "..", "..", "Claude_agent", "Brain")
)

# Friendly labels for the brand picker; falls back to a title-cased slug.
LABEL_OVERRIDES = {
    "_template-guidance": "Microsoft — Mono Type",
}


def _load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _write(name, data):
    out = os.path.join(OUT_DIR, name + ".json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    print("  wrote brain/%s.json" % name)


def _label_for(slug, tokens):
    if slug in LABEL_OVERRIDES:
        return LABEL_OVERRIDES[slug]
    name = (tokens.get("brand") or {}).get("name") \
        or (tokens.get("guidance") or {}).get("name")
    if name:
        # "Microsoft Azure" -> "Azure"; "Microsoft 365 Copilot" -> "Microsoft 365 Copilot"
        return name.replace("Microsoft Azure", "Azure")
    return slug.lstrip("_").replace("-", " ").title()


def main(argv=None):
    argv = argv or sys.argv[1:]
    src = os.path.abspath(argv[0]) if argv else DEFAULT_SRC
    if not os.path.isdir(src):
        sys.stderr.write("Brain source not found: %s\n" % src)
        sys.stderr.write("Pass the Brain folder path as the first argument.\n")
        return 2

    print("Brain source: %s" % src)
    print("Output:       %s" % OUT_DIR)

    # Shared, single-source files.
    _write("compliance", _load(os.path.join(src, "_template-guidance", "compliance.yaml")))
    _write("typography-scale", _load(os.path.join(src, "_shared", "typography.yaml")))
    _write("catalog", _load(os.path.join(src, "_shared", "template-catalog.yaml")))

    # Geometry specs (already JSON) — the audit reads each node's intended role by position to
    # check/auto-fix geometry templates (mono-type) precisely. Published under brain/templates/.
    tdir = os.path.join(src, "_shared", "templates")
    if os.path.isdir(tdir):
        for fn in sorted(os.listdir(tdir)):
            if fn.endswith(".json"):
                _write(os.path.join("templates", fn[:-5]).replace("\\", "/"), _load(os.path.join(tdir, fn)))

    # Every brand dir that has a tokens.yaml (skip _shared).
    brands = []
    for entry in sorted(os.listdir(src)):
        d = os.path.join(src, entry)
        tok = os.path.join(d, "tokens.yaml")
        if entry == "_shared" or not os.path.isfile(tok):
            continue
        tokens = _load(tok)
        _write(entry, tokens)
        brands.append({"slug": entry, "label": _label_for(entry, tokens)})

    # Put the base skin first in the picker.
    brands.sort(key=lambda b: (b["slug"] != "_template-guidance", b["label"]))
    _write("brains", {"brands": brands})

    print("Done — %d brand(s): %s" % (len(brands), ", ".join(b["slug"] for b in brands)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
