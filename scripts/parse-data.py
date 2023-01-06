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
                score_l = line[left]
                score_r = line[right]
                if not (score_l.isnumeric() and score_r.isnumeric()):
                    continue
                score = Score(
                    team_a=line[left - 1],
                    score_a=int(score_l),
                    team_b=line[right + 1],
                    score_b=int(score_r),
                    time=line[right + 3],
                    stage=stage,
                )
                scores.append(score._asdict())
    return scores


def parse_brackets_data(path):
    return []


def convert_raw_data_to_json(group_name):
    groups = get_data_files()
    files = groups.get(group_name, [])

    data = []
    pools = [f for f in files if f.name.endswith("pools.csv")]
    if pools:
        data += parse_pools_data(pools[0])

    brackets = [f for f in files if f.name.endswith("brackets.csv")]
    if brackets:
        data += parse_brackets_data(pools[0])

    with open(PUBLIC_DATA_DIR.joinpath(f"{group_name}.json"), "w") as f:
        json.dump(data, f, indent=2)


if __name__ == "__main__":
    convert_raw_data_to_json("ncs-22-23-mixed-regionals-south")
