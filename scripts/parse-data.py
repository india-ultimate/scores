#!/usr/bin/env python
import csv
import datetime
import difflib
import json
import re
from collections import namedtuple
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.absolute()
DATA_DIR = ROOT_DIR.joinpath("data")
RAW_DATA_DIR = DATA_DIR.joinpath("raw")
PUBLIC_DATA_DIR = ROOT_DIR.joinpath("public", "data")


Score = namedtuple(
    "Score",
    (
        "team_a",
        "score_a",
        "team_b",
        "score_b",
        "stage",
        "pool_name",
        "bracket_name",
        "bracket_round",
        "time",
    ),
)


def find_pool_data_columns(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        score_columns = []
        time_column = []
        for i, line in enumerate(csv_data):
            for col, header in enumerate(line):
                if header.strip() == "Score":
                    score_columns.append(col)
                elif header.strip() == "Time":
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
                pool_name = f"Pool {pool}" if not pool.isnumeric() else "Pool [Extra]"
                score = Score(
                    team_a=team_l,
                    score_a=int(score_l),
                    team_b=team_r,
                    score_b=int(score_r),
                    time=time,
                    stage=stage,
                    pool_name=pool_name,
                    bracket_name="",
                    bracket_round=-1,
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
                    content.strip() == "1"
                    and line[col + 1].strip()
                    and line[col + 2].strip().isnumeric()
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
        columns = sorted(find_bracket_data_columns(path))
        pools_rows = {}
        brackets_pools = set()
        for row, line in enumerate(csv_data):
            for col in columns:
                seed = line[col].strip()
                name = line[col + 1].strip()
                score = line[col + 2].strip()
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
            bracket_name=get_bracket_name(columns, col),
            bracket_round=columns.index(col),
        )
        scores.append(score._asdict())
    return scores, brackets_pools


def get_bracket_name(columns, col):
    round_ = columns[::-1].index(col)
    if round_ == 0:
        return "Finals"
    elif round_ == 1:
        return "Semis"
    elif round_ == 2:
        return "Quarters"
    else:
        n = round_ - 2
        prefix = " ".join(["Pre"] * n)
        return f"{prefix} Quarters"


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


def parse_rankings(path, num_teams):
    columns = find_bracket_data_columns(path)
    last_column = columns[-1] + 1 if columns else 0
    with open(path) as f:
        csv_data = csv.reader(f)
        ranking_columns = []
        for i, line in enumerate(csv_data):
            n = len(line)
            for col, content in enumerate(line[last_column:], start=last_column):
                if col + 1 >= n:
                    continue
                if (
                    content.strip() == str(num_teams)
                    and line[col + 1].strip()
                    and not line[col + 1].strip().isnumeric()
                ):
                    ranking_columns.append(col)

    ranks = {}
    if not ranking_columns:
        return ranks

    ranking_column = sorted(ranking_columns)[0]
    with open(path) as f:
        csv_data = csv.reader(f)
        for i, line in enumerate(csv_data):
            rank, team = line[ranking_column].strip(), line[ranking_column + 1].strip()
            if rank.isnumeric() and team and not team.isnumeric():
                rank = int(rank)
                if rank not in ranks:
                    ranks[rank] = team
                else:
                    break

    assert len(ranks) == num_teams
    return ranks


def find_seed_data_columns(path):
    with open(path) as f:
        csv_data = csv.reader(f)
        seed_columns = []
        s = {"seed", "seeding"}
        t = {"team", "team name"}
        for i, line in enumerate(csv_data):
            for col, header in enumerate(line):
                if header.strip().lower() in s:
                    if line[col + 1].strip().lower() in t:
                        seed_columns.append(col)
            if i > 2:
                break
        return seed_columns


def parse_seeds(path, num_teams):
    seed_columns = find_seed_data_columns(path)
    seeds = {}
    with open(path) as f:
        csv_data = csv.reader(f)
        for i, line in enumerate(csv_data):
            for seed_column in seed_columns:
                seeds_ = seeds.setdefault(seed_column, {})
                seed, team = line[seed_column].strip(), line[seed_column + 1].strip()
                if seed.isnumeric() and team and not team.isnumeric():
                    seed = int(seed)
                    if seed not in seeds_:
                        seeds_[seed] = team
                    else:
                        break
    for seedings in seeds.values():
        if len(seedings) == num_teams:
            return seedings

    return {}


def fix_team_name(name, names):
    l_name = name.lower()
    if l_name in names:
        return names[l_name]
    c_name = clean_team_name(name)
    close_names = difflib.get_close_matches(c_name, names, n=1)
    return names[close_names[0]] if close_names else name


def clean_team_name(name):
    """Clean up test names so that difflib.get_close_matches works better

    >>> clean_team_name('Hammer that zone - 1')
    'Hammer that zone-1'
    >>> clean_team_name('SpyBITS (BPHC+Sapthavyuha)')
    'SpyBITS'
    >>> clean_team_name('(TIKS) Openside')
    '(TIKS) Openside'
    >>> clean_team_name('Openside (TIKS)')
    'Openside'
    """
    name = re.sub(r"\s([+-])\s", r"\1", name.strip())
    return re.sub(r"\(.*\)$", "", name).strip()


def convert_raw_data_to_json(tournament):
    slug = tournament["slug"]
    num_teams = tournament["num_teams"]
    data = []
    rankings = {}
    seedings = {}

    pools = RAW_DATA_DIR.joinpath(f"{slug}-pools.csv")
    if pools.exists():
        data += parse_pools_data(pools)

    brackets = RAW_DATA_DIR.joinpath(f"{slug}-brackets.csv")
    if brackets.exists():
        brackets_data, exclude_pools = parse_brackets_data(brackets)
        data = [game for game in data if game["pool_name"].lower() not in exclude_pools]
        data += brackets_data

        rankings = parse_rankings(brackets, num_teams)

    seeds = RAW_DATA_DIR.joinpath(f"{slug}-seeds.csv")
    if seeds.exists():
        seedings = parse_seeds(seeds, num_teams)

        canonical_names = {
            clean_team_name(name).lower(): name for name in seedings.values()
        }
        for rank, name in rankings.items():
            name_ = fix_team_name(name, canonical_names)
            if name_ != name:
                rankings[rank] = name_

        for score in data:
            for key in ["team_a", "team_b"]:
                name = score[key]
                name_ = fix_team_name(name, canonical_names)
                if name_ != name:
                    score[key] = name_

    with open(PUBLIC_DATA_DIR.joinpath(f"{slug}.json"), "w") as f:
        tournament["scores"] = data
        tournament["rankings"] = [
            {"rank": rank, "team": team} for rank, team in sorted(rankings.items())
        ]
        tournament["seedings"] = [
            {"rank": rank, "team": team} for rank, team in sorted(seedings.items())
        ]
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
