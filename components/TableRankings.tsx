import { Table, Text, ScrollArea, Title } from "@mantine/core";

export interface Rank {
	rank: number;
	team: string;
}
interface RankingsTableProps {
	data: Rank[];
	isSeed: boolean;
}

export function TableRankings({ data, isSeed }: RankingsTableProps) {
	const rows = data.map((item) => (
		<tr key={item.rank}>
			<td>
				<Text>{item.rank}</Text>
			</td>
			<td>
				<Text>{item.team}</Text>
			</td>
		</tr>
	));

	return (
		<ScrollArea>
			<Title ta="center" order={2}>
				{isSeed ? "Seedings" : "Rankings"}
			</Title>
			<Table sx={{ maxWidth: 300, margin: "auto" }} verticalSpacing="sm">
				<thead>
					<tr>
						<th>{isSeed ? "Seed" : "Rank"}</th>
						<th>Team</th>
					</tr>
				</thead>
				<tbody>{rows}</tbody>
			</Table>
		</ScrollArea>
	);
}
