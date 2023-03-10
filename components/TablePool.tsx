import { useState } from "react";
import {
	createStyles,
	Table,
	ScrollArea,
	UnstyledButton,
	Group,
	Text,
	Center,
	Badge,
	Title,
} from "@mantine/core";
import {
	IconSelector,
	IconChevronDown,
	IconChevronUp,
	IconBrandYoutube,
} from "@tabler/icons";

const useStyles = createStyles((theme) => ({
	th: {
		padding: "0 !important",
	},

	control: {
		width: "100%",
		padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,

		"&:hover": {
			backgroundColor:
				theme.colorScheme === "dark"
					? theme.colors.dark[6]
					: theme.colors.gray[0],
		},
	},

	icon: {
		width: 21,
		height: 21,
		borderRadius: 21,
	},
}));

export interface RowData {
	team_a: string;
	score_a: number;
	team_b: string;
	score_b: number;
	stage: string;
	pool_name: string;
	bracket_round: number;
	bracket_name: string;
	videos: string | null;
}

interface TablePoolProps {
	data: RowData[];
	name: string;
}

interface ThProps {
	children: React.ReactNode;
	reversed: boolean;
	sorted: boolean;
	onSort(): void;
	sortable?: boolean;
}

function Th({ children, reversed, sorted, onSort, sortable = true }: ThProps) {
	const { classes } = useStyles();
	const Icon = sorted
		? reversed ? IconChevronUp : IconChevronDown
		: IconSelector;
	return (
		<th className={classes.th}>
			<UnstyledButton
				onClick={sortable ? onSort : () => {}}
				className={classes.control}
			>
				<Group position="apart">
					<Text weight={500} size="sm">
						{children}
					</Text>
					{sortable && (
						<Center className={classes.icon}>
							<Icon size={14} stroke={1.5} />
						</Center>
					)}
				</Group>
			</UnstyledButton>
		</th>
	);
}

function sortData(
	data: RowData[],
	payload: { sortBy: keyof RowData | null; reversed: boolean }
) {
	const { sortBy } = payload;

	if (!sortBy) {
		return data;
	}

	return [...data].sort((a, b) => {
		if (payload.reversed) {
			return (b[sortBy] as string).localeCompare(a[sortBy] as string);
		}

		return (a[sortBy] as string).localeCompare(b[sortBy] as string);
	});
}

export function TablePool({ data, name }: TablePoolProps) {
	const [sortedData, setSortedData] = useState(data);
	const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
	const [reverseSortDirection, setReverseSortDirection] = useState(false);

	const setSorting = (field: keyof RowData) => {
		const reversed = field === sortBy ? !reverseSortDirection : false;
		setReverseSortDirection(reversed);
		setSortBy(field);
		setSortedData(sortData(data, { sortBy: field, reversed }));
	};

	const rows = sortedData.map((row, index) => {
		return (
			<tr key={index}>
				<td>
					{row.videos ? (
						<a
							target="_blank"
							rel="noopener noreferrer"
							href={row.videos}
						>
							<IconBrandYoutube size={25} stroke={2} />
						</a>
					) : (
						undefined
					)}
				</td>
				<td
					style={{
						color:
							row.score_a > row.score_b ? "#38D9A9" : "#FF8787",
					}}
				>
					{row.team_a}
				</td>
				<td>{row.score_a}</td>
				<td>{row.score_b}</td>
				<td
					style={{
						color:
							row.score_b > row.score_a ? "#38D9A9" : "#FF8787",
					}}
				>
					{row.team_b}
				</td>
			</tr>
		);
	});

	return (
		<ScrollArea>
			<Table
				horizontalSpacing="xs"
				verticalSpacing="xs"
				sx={{ tableLayout: "fixed" }}
			>
				<thead>
					<tr>
						<th style={{ width: "2rem" }} />
						<Th
							sorted={sortBy === "team_a"}
							reversed={reverseSortDirection}
							onSort={() => setSorting("team_a")}
						>
							Team
						</Th>
						<Th
							sorted={sortBy === "score_a"}
							reversed={reverseSortDirection}
							onSort={() => setSorting("score_a")}
							sortable={false}
						>
							Score
						</Th>
						<Th
							sorted={sortBy === "score_b"}
							reversed={reverseSortDirection}
							onSort={() => setSorting("score_b")}
							sortable={false}
						>
							Score
						</Th>
						<Th
							sorted={sortBy === "team_b"}
							reversed={reverseSortDirection}
							onSort={() => setSorting("team_b")}
						>
							Team
						</Th>
					</tr>
				</thead>
				<tbody>
					{rows.length > 0 ? (
						rows
					) : (
						<tr>
							<td colSpan={Object.keys(data[0]).length}>
								<Text weight={500} align="center">
									Nothing found
								</Text>
							</td>
						</tr>
					)}
				</tbody>
			</Table>
		</ScrollArea>
	);
}
