#!/usr/bin/env python
from collections import defaultdict, namedtuple
import csv
import json
from pathlib import Path

import requests

ROOT_DIR = Path(__file__).parent.parent.absolute()
DATA_DIR = ROOT_DIR.joinpath("data")
RAW_DATA_DIR = DATA_DIR.joinpath("raw")
PUBLIC_DATA_DIR = ROOT_DIR.joinpath("public", "data")


Score = namedtuple("Score", ("team_a", "score_a", "team_b", "score_b", "stage", "time"))


def get_data_files():
    files = {path.stem: path for path in RAW_DATA_DIR.glob("*.csv")}
    groups = defaultdict(list)
    for name, path in files.items():
        prefix = name.rsplit("-", 1)[0]
        groups[prefix].append(path)
    return groups


def find_score_columns(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        score_columns = []
        for i, line in enumerate(csv_data):
            for col, header in enumerate(line):
                if header == "Score":
                    score_columns.append(col)
            if i > 2:
                break
        return score_columns


def parse_pools_data(path, stage="pool"):
    score_columns = find_score_columns(path)
    scores = []
    with open(path) as f:
        csv_data = csv.reader(f)
        for line in csv_data:
            for left, right in zip(score_columns[::2], score_columns[1::2]):
                score_l = line[left].strip()
                score_r = line[right].strip()
                if not (score_l.isnumeric() and score_r.isnumeric()):
                    continue
                score = Score(
                    team_a=line[left - 1].strip(),
                    score_a=int(score_l),
                    team_b=line[right + 1].strip(),
                    score_b=int(score_r),
                    time=line[right + 3].strip(),
                    stage=stage,
                )
                scores.append(score._asdict())
    return scores


def parse_brackets_data(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        data = {}
        header = next(csv_data)
        columns = list(range(len(header) // 4))
        for row, line in enumerate(csv_data):
            for col in columns:
                seed = line[col]
                name = line[col + 1]
                score = line[col + 2]
                if seed.isnumeric() and name and score.isnumeric():
                    data[(row, col)] = (seed, name, score)

    matches = sorted(data.keys())
    stage = "brackets"
    scores = []
    for left, right in zip(matches[::2], matches[1::2]):
        _, team_a, score_a = data[left]
        _, team_b, score_b = data[right]
        score = Score(
            team_a=team_a.strip(),
            score_a=int(score_a.strip()),
            team_b=team_b.strip(),
            score_b=int(score_b.strip()),
            time="",
            stage=stage,
        )
        scores.append(score._asdict())
    return scores


def convert_raw_data_to_json(tournament):
    groups = get_data_files()
    slug = tournament["slug"]
    files = groups.get(slug, [])

    data = []
    pools = [f for f in files if f.name.endswith("pools.csv")]
    if pools:
        data += parse_pools_data(pools[0])

    brackets = [f for f in files if f.name.endswith("brackets.csv")]
    if brackets:
        data += parse_brackets_data(brackets[0])

    with open(PUBLIC_DATA_DIR.joinpath(f"{slug}.json"), "w") as f:
        json.dump(data, f, indent=2)


if __name__ == "__main__":
    with open(PUBLIC_DATA_DIR.joinpath("tournaments.json")) as f:
        tournaments = json.load(f)

    for tournament in tournaments:
        convert_raw_data_to_json(tournament)
