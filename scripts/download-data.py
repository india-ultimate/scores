#!/usr/bin/env python
import datetime
import json
from pathlib import Path

import requests

ROOT_DIR = Path(__file__).parent.parent.absolute()
PUBLIC_DATA_DIR = ROOT_DIR.joinpath("public", "data")
RAW_DATA_DIR = ROOT_DIR.joinpath("data", "raw")


def get_tournament_sheet(tournament, stage):
    sheet_id = tournament["sheet_id"]
    sheet_name = tournament["sheets"][stage]
    name = tournament["name"]
    print(f"Downloading '{sheet_name}' data for '{name}'")
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"
    response = requests.get(url)
    slug = tournament["slug"]
    path = RAW_DATA_DIR.joinpath(f"{slug}-{stage}.csv")

    with open(path, "w") as f:
        f.write(response.text)

    return path


def main(slug=None):
    with open(PUBLIC_DATA_DIR.joinpath("tournaments.json")) as f:
        tournaments = json.load(f)

    for tournament in tournaments:
        if slug and not tournament["slug"] == slug:
            continue
        if not slug and str(datetime.date.today()) > tournament["expiry"]:
            print(f"Skipping '{tournament['name']}' with expiry date in the past.")
            continue
        for stage in tournament["sheets"]:
            get_tournament_sheet(tournament, stage)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--slug", default=None)
    args = parser.parse_args()

    main(args.slug)
