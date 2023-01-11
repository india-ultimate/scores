import { Table, Text, ScrollArea, Title } from "@mantine/core";

export interface Rank {
	rank: number;
	team: string;
}
interface UsersTableProps {
	data: Rank[];
}

export function TableRankings({ data }: UsersTableProps) {
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
				Rankings
			</Title>
			<Table sx={{ maxWidth: 300, margin: "auto" }} verticalSpacing="sm">
				<thead>
					<tr>
						<th>Rank</th>
						<th>Team</th>
					</tr>
				</thead>
				<tbody>{rows}</tbody>
			</Table>
		</ScrollArea>
	);
}
