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
    gid = tournament["sheets"][stage]
    name = tournament["name"]
    print(f"    Downloading '{stage}#{gid}'")
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    if gid != "0":
        url += f"&gid={gid}"
    response = requests.get(url)
    slug = tournament["slug"]
    path = RAW_DATA_DIR.joinpath(f"{slug}-{stage}.csv")

    with open(path, "w") as f:
        f.write(response.text)

    return path


def main(slug=None, all_=False):
    with open(PUBLIC_DATA_DIR.joinpath("tournaments.json")) as f:
        tournaments = json.load(f)

    for tournament in tournaments:
        if slug and not tournament["slug"] == slug:
            continue
        if not (all_ or slug) and str(datetime.date.today()) > tournament["expiry"]:
            print(f"Skipping '{tournament['name']}' with expiry date in the past.")
            continue
        print(f"Downloading data for '{tournament['name']}'")
        for stage in tournament["sheets"]:
            get_tournament_sheet(tournament, stage)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--slug", default=None)
    parser.add_argument("--all", default=False, action="store_true")
    args = parser.parse_args()

    main(args.slug, args.all)
