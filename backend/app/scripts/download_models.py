"""Download the two Hugging Face models DermaSoul AI uses into backend/app/ml/hf_models/ and check they load.

    cd backend
    python -m app.scripts.download_models            # download (skips models already present) + verify
    python -m app.scripts.download_models --force    # download again even if present
    python -m app.scripts.download_models --verify-only

The models are pinned to exact revisions so every machine gets identical files. Only the files the app
needs are fetched (about 680 MB in total); ONNX exports and duplicate .bin weights are skipped.
The EfficientNet image models (.pth) are part of the repository and are not downloaded here.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# This script must reach the Hub even if HF_HUB_OFFLINE is set in the environment.
os.environ["HF_HUB_OFFLINE"] = "0"
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "180")

HF_DIR = Path(__file__).resolve().parents[1] / "ml" / "hf_models"

MODELS = [
    {
        "folder": "biomedical-ner-all",
        "repo_id": "d4data/biomedical-ner-all",
        "revision": "015a4050c9ac99722e61c547aa9b4282bcbedc7f",
        "files": ["config.json", "model.safetensors", "special_tokens_map.json", "tokenizer.json",
                  "tokenizer_config.json", "vocab.txt"],
        "purpose": "clinical NER for symptom text",
    },
    {
        "folder": "bge-base-en-v1.5",
        "repo_id": "BAAI/bge-base-en-v1.5",
        "revision": "a5beb1e3e68b9ab74eb54cfd186867f64f240e1a",
        "files": ["1_Pooling/config.json", "config.json", "config_sentence_transformers.json", "model.safetensors",
                  "modules.json", "sentence_bert_config.json", "special_tokens_map.json", "tokenizer.json",
                  "tokenizer_config.json", "vocab.txt"],
        "purpose": "RAG embeddings (768-d)",
    },
]


def is_complete(model: dict) -> bool:
    folder = HF_DIR / model["folder"]
    return all((folder / name).is_file() and (folder / name).stat().st_size > 0 for name in model["files"])


def download(model: dict) -> None:
    from huggingface_hub import hf_hub_download

    folder = HF_DIR / model["folder"]
    folder.mkdir(parents=True, exist_ok=True)
    for name in model["files"]:
        print(f"    {name}", flush=True)
        hf_hub_download(repo_id=model["repo_id"], filename=name, revision=model["revision"], local_dir=str(folder))


def verify() -> bool:
    ok = True
    ner_dir, emb_dir = HF_DIR / MODELS[0]["folder"], HF_DIR / MODELS[1]["folder"]
    try:
        from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline

        ner = pipeline("token-classification", model=AutoModelForTokenClassification.from_pretrained(str(ner_dir)),
                       tokenizer=AutoTokenizer.from_pretrained(str(ner_dir)), aggregation_strategy="first")
        found = [e["word"] for e in ner("itchy red rash on my arm for two weeks")]
        print(f"  OK  NER model loads; test sentence -> {found}")
    except Exception as exc:  # pragma: no cover - diagnostic output only
        ok = False
        print(f"  FAIL NER model: {exc}")
    try:
        from sentence_transformers import SentenceTransformer

        vector = SentenceTransformer(str(emb_dir)).encode("eczema itching", normalize_embeddings=True)
        print(f"  OK  embedding model loads; vector length {len(vector)}")
        ok = ok and len(vector) == 768
    except Exception as exc:  # pragma: no cover
        ok = False
        print(f"  FAIL embedding model: {exc}")
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="Download and verify DermaSoul AI's Hugging Face models.")
    parser.add_argument("--force", action="store_true", help="download even if the files are already present")
    parser.add_argument("--verify-only", action="store_true", help="only check that the models load")
    args = parser.parse_args()

    if not args.verify_only:
        for model in MODELS:
            if is_complete(model) and not args.force:
                print(f"= {model['folder']} already present ({model['purpose']})")
                continue
            print(f"> downloading {model['repo_id']} -> hf_models/{model['folder']} ({model['purpose']})", flush=True)
            download(model)
    print("Verifying models ...", flush=True)
    if verify():
        print("All models ready.")
        return 0
    print("Model check failed - see messages above.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
