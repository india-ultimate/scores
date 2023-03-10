import React, { useState, useEffect } from "react";
import {
	Select,
	Title,
	Grid,
	Card,
	Text,
	AppShell,
	Header,
	Group,
	Footer,
	Anchor,
	SimpleGrid,
} from "@mantine/core";
import { Scores } from "../components/Scores";
import { TableRankings, Rank } from "../components/TableRankings";
import tournamentsData from "../public/data/tournaments.json";
import Image from "next/image";

interface Tournament {
	slug: string;
	name: string;
}

interface Metadata {
	slug: string;
	name: string;
	rankings: Rank[];
	seedings: Rank[];
}

export default function Home() {
	const [scores, setScores] = useState([]);
	const [metadata, setMetadata] = useState({
		slug: "",
		name: "",
		rankings: [],
		seedings: [],
	});
	const tournaments = tournamentsData.map((it: Tournament) => ({
		value: it.slug,
		label: it.name,
	}));
	const latestTournament = tournaments[tournaments.length - 1];

	const selectTournament = (name: string) => {
		setScores([]);
		fetch(`/data/${name}.json`)
			.then((response) => response.json())
			.then((tournament) => {
				const { scores, ...metadata } = tournament;
				setScores(scores);
				setMetadata(metadata);
			});
	};

	useEffect(
		() => {
			selectTournament(latestTournament.value);
		},
		[latestTournament.value]
	);

	const getLink = (url: string) => (
		<a target="_blank" rel="noopener noreferrer" href={url}>
			{url}
		</a>
	);

	const getSheetLink = (sheetId: string) => {
		const url = `https://docs.google.com/spreadsheets/d/${sheetId}/`;
		return getLink(url);
	};

	const displayList = (metadata: Metadata) => {
		const displayKeys = new Set([
			"sheet_id",
			"date",
			"venue",
			"division",
			"photos",
			"uc_url",
		]);
		return Object.entries(metadata)
			.filter((it) => displayKeys.has(it[0]))
			.map((entry) => {
				const [_key, _value] = entry;
				const value =
					_key === "sheet_id"
						? getSheetLink(_value)
						: _key === "photos" || _key === "uc_url"
							? getLink(_value)
							: _value;
				const key =
					_key === "sheet_id"
						? "source"
						: _key === "uc_url" ? "UC page" : _key;
				return { value, key };
			});
	};

	return (
		<>
			<AppShell
				padding="md"
				fixed={false}
				footer={
					<Footer height={60}>
						<Text align="center">
							<Anchor
								href="https://github.com/india-ultimate/scores/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Built
							</Anchor>{" "}
							with ???? in Bengaluru
						</Text>
					</Footer>
				}
				header={
					<Header height={60}>
						<Group sx={{ height: "100%" }} px={20} position="apart">
							<Title>Scores ??? India Ultimate</Title>

							<a
								href="https://indiaultimate.org"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="https://d36m266ykvepgv.cloudfront.net/uploads/media/o4G97mT9vR/s-448-250/upai-2.png"
									alt="Vercel Logo"
									width={102}
									height={62}
								/>
							</a>
						</Group>
					</Header>
				}
				styles={(theme) => ({
					main: {
						backgroundColor:
							theme.colorScheme === "dark"
								? theme.colors.dark[8]
								: theme.colors.gray[0],
					},
				})}
			>
				<div>
					<Select
						label="Select Tournament"
						placeholder="select tournament"
						defaultValue={latestTournament.value}
						data={tournaments}
						onChange={selectTournament}
					/>
					{metadata.name.length > 0 && (
						<Title ta="center" order={2}>
							{metadata.name}
						</Title>
					)}
					{metadata.name.length > 0 && (
						<Card>
							{displayList(metadata).map((item) => (
								<Grid key={item.key}>
									<Grid.Col span={2}>
										<Text fz="sm" c="dimmed">
											{item.key}
										</Text>
									</Grid.Col>
									<Grid.Col span={10}>
										<Text fz="sm">{item.value}</Text>
									</Grid.Col>
								</Grid>
							))}
						</Card>
					)}
					<SimpleGrid cols={2}>
						{metadata.seedings.length > 0 && (
							<TableRankings
								data={metadata.seedings}
								isSeed={true}
							/>
						)}
						{metadata.rankings.length > 0 && (
							<TableRankings
								data={metadata.rankings}
								isSeed={false}
							/>
						)}
					</SimpleGrid>
					{scores.length > 0 && <Scores data={scores} />}
				</div>
			</AppShell>
		</>
	);
}
