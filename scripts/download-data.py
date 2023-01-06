#!/usr/bin/env python
from pathlib import Path

import requests

ROOT_DIR = Path(__file__).parent.parent.absolute()
RAW_DATA_DIR = ROOT_DIR.joinpath("data", "raw")


def get_player_stats(sheet_id, sheet_name, tournament_name):
    print(f"Downloading '{sheet_name}' data for '{tournament_name}'")
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"
    response = requests.get(url)
    slug = tournament_name.replace(" ", "-").lower()
    stage = sheet_name.replace(" ", "-").lower()
    path = RAW_DATA_DIR.joinpath(f"{slug}-{stage}.csv")

    with open(path, "w") as f:
        f.write(response.text)

    return path


if __name__ == "__main__":
    get_player_stats(
        "18eJUXRPuJQCVEsEukqDtB3PMy--CmzSZcIX9QJO4gfY",
        "Pools",
        "NCS 22-23 Mixed Regionals South",
    )
