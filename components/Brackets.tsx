import {
	Bracket,
	Seed,
	SeedItem,
	SeedTeam,
	IRenderSeedProps,
} from "react-brackets";
import { IconBrandYoutube } from "@tabler/icons";
import { SimpleGrid, MediaQuery } from "@mantine/core";
import { useState } from "react";
import { RowData } from "./TablePool";

const CustomSeed = ({ seed, breakpoint }: IRenderSeedProps) => {
	const homeTeam = seed.teams[0];
	const awayTeam = seed.teams[1];
	const video = seed.videos ? (
		<a target="_blank" rel="noopener noreferrer" href={seed.videos}>
			<IconBrandYoutube size={25} stroke={1} />
		</a>
	) : (
		""
	);
	return (
		<Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
			<SeedItem>
				<div>
					<SeedTeam
						style={{
							backgroundColor:
								homeTeam.score > awayTeam.score && "red",
						}}
					>
						<div>{homeTeam.name}</div>
						<div>{homeTeam.score}</div>
					</SeedTeam>
					<SeedTeam
						style={{
							backgroundColor:
								homeTeam.score < awayTeam.score && "red",
						}}
					>
						<div>{awayTeam.name}</div>
						<div>{awayTeam.score}</div>
					</SeedTeam>
				</div>
			</SeedItem>
			<div>{video}</div>
		</Seed>
	);
};

interface BracketData {
	brackets: RowData[];
}

export function Brackets({ brackets }: BracketData) {
	const [tabIndex, setTabIndex] = useState(0);

	const handleTabIndexChange = (index: number) => () => {
		setTabIndex(index);
	};

	const handleSwipeChange = (index: number) => {
		setTabIndex(index);
	};

	const bracketRounds = Array.from(
		new Set(brackets.map((it) => it.bracket_round))
	);
	const rounds = bracketRounds.map((r) => {
		const roundGames = brackets.filter((g) => g.bracket_round === r);
		const title = roundGames[0].bracket_name;
		const seeds = roundGames.map((g, idx) => ({
			id: `${r}-${idx}`,
			videos: g.videos,
			teams: [
				{ id: g.team_a, name: g.team_a, score: g.score_a },
				{ id: g.team_b, name: g.team_b, score: g.score_b },
			],
		}));
		return { title, seeds };
	});

	const buttons = rounds.map((round, idx) => (
		<button key={idx} onClick={handleTabIndexChange(idx)}>
			{round.title}
		</button>
	));

	return (
		<div className="brackets">
			<MediaQuery query="(min-width: 993px)" styles={{ display: "none" }}>
				<SimpleGrid cols={4}>{buttons}</SimpleGrid>
			</MediaQuery>
			<Bracket
				rounds={rounds}
				renderSeedComponent={CustomSeed}
				swipeableProps={{
					enableMouseEvents: true,
					animateHeight: true,
					index: tabIndex,
					onChangeIndex: handleSwipeChange,
				}}
			/>
		</div>
	);
}
