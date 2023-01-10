#!/usr/bin/env python
import csv
import datetime
import json
from collections import namedtuple
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.absolute()
DATA_DIR = ROOT_DIR.joinpath("data")
RAW_DATA_DIR = DATA_DIR.joinpath("raw")
PUBLIC_DATA_DIR = ROOT_DIR.joinpath("public", "data")


Score = namedtuple(
    "Score", ("team_a", "score_a", "team_b", "score_b", "stage", "pool_name", "time")
)


def find_pool_data_columns(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        score_columns = []
        time_column = []
        for i, line in enumerate(csv_data):
            for col, header in enumerate(line):
                if header == "Score":
                    score_columns.append(col)
                elif header == "Time":
                    time_column.append(col)
            if i > 2:
                break
        return score_columns, time_column


def parse_pools_data(path, stage="pool"):
    score_columns, time_column = find_pool_data_columns(path)
    scores = []
    with open(path) as f:
        csv_data = csv.reader(f)
        for line in csv_data:
            for i, (left, right) in enumerate(
                zip(score_columns[::2], score_columns[1::2])
            ):
                score_l = line[left].strip()
                score_r = line[right].strip()
                if not (score_l.isnumeric() and score_r.isnumeric()):
                    continue
                team_l = line[left - 1].strip()
                team_r = line[right + 1].strip()
                if not team_l or team_l.isnumeric() or not team_r or team_r.isnumeric():
                    continue
                time = line[time_column[i]].strip() if i < len(time_column) else ""
                pool = line[left - 2].strip()[0]
                pool_name = f"Pool {pool}" if not pool.isnumeric() else "Pool Extra"
                score = Score(
                    team_a=team_l,
                    score_a=int(score_l),
                    team_b=team_r,
                    score_b=int(score_r),
                    time=time,
                    stage=stage,
                    pool_name=pool_name,
                )
                scores.append(score._asdict())
    return scores


def find_bracket_data_columns(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        score_columns = []
        for i, line in enumerate(csv_data):
            n = len(line)
            for col, content in enumerate(line):
                if col + 2 >= n:
                    continue
                if (
                    content == "1"
                    and line[col + 1]
                    and line[col + 2].isnumeric()
                    and (
                        col + 3 < n
                        and not line[col + 3].encode("ascii", errors="ignore")
                    )
                ):
                    score_columns.append(col)
        return score_columns


def parse_brackets_data(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        data = {}
        header = next(csv_data)
        columns = sorted(find_bracket_data_columns(path))
        pools_rows = {}
        brackets_pools = set()
        for row, line in enumerate(csv_data):
            for col in columns:
                seed = line[col]
                name = line[col + 1]
                score = line[col + 2]
                if seed.isnumeric() and name and score.isnumeric():
                    data[(col, row)] = (seed, name, score)
                elif seed.lower().startswith("pool "):
                    brackets_pools.add(seed.lower())
                    pools_col = pools_rows.setdefault(col, {})
                    pools_col[row] = seed.title()

    matches = sorted(data.keys())
    stage = "brackets"
    scores = []

    for left, right in zip(matches[::2], matches[1::2]):
        _, team_a, score_a = data[left]
        _, team_b, score_b = data[right]
        col, row = left
        pool_name = find_bracket_pool_name(pools_rows, col, row)
        score = Score(
            team_a=team_a.strip(),
            score_a=int(score_a.strip()),
            team_b=team_b.strip(),
            score_b=int(score_b.strip()),
            time="",
            stage=stage,
            pool_name=pool_name,
        )
        scores.append(score._asdict())
    return scores, brackets_pools


def find_bracket_pool_name(pools_rows, col, row):
    if col in pools_rows:
        rows = [v for v in pools_rows[col].keys() if v <= row]
        if rows:
            row_ = max(rows)
            return pools_rows[col][row_]
        else:
            return ""
    else:
        return ""


def convert_raw_data_to_json(tournament):
    slug = tournament["slug"]
    data = []

    pools = RAW_DATA_DIR.joinpath(f"{slug}-pools.csv")
    if pools.exists():
        data += parse_pools_data(pools)

    brackets = RAW_DATA_DIR.joinpath(f"{slug}-brackets.csv")
    if brackets.exists():
        brackets, exclude_pools = parse_brackets_data(brackets)
        data = [game for game in data if game["pool_name"].lower() not in exclude_pools]
        data += brackets

    with open(PUBLIC_DATA_DIR.joinpath(f"{slug}.json"), "w") as f:
        tournament["data"] = data
        json.dump(tournament, f, indent=2, ensure_ascii=False)


def main(slug=None, all_=False):
    with open(PUBLIC_DATA_DIR.joinpath("tournaments.json")) as f:
        tournaments = json.load(f)

    for tournament in tournaments:
        if slug and not tournament["slug"] == slug:
            continue
        if not (all_ or slug) and str(datetime.date.today()) > tournament["expiry"]:
            print(f"Skipping '{tournament['name']}' with expiry date in the past.")
            continue
        print(f"Parsing data for '{tournament['name']}'")
        convert_raw_data_to_json(tournament)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--slug", default=None)
    parser.add_argument("--all", default=False, action="store_true")
    args = parser.parse_args()

    main(args.slug, args.all)
