import { ScrollArea, Accordion, Title } from "@mantine/core";
import { TablePool, RowData } from "./TablePool";

interface Scores {
	data: RowData[];
}
type GameType = {
	[key: string]: RowData[];
};

export function Scores({ data }: Scores) {
	const poolGames = data.filter((it) => it.stage === "pool");
	const poolNames = Array.from(new Set(poolGames.map((it) => it.pool_name)));
	poolNames.sort();
	const gamesByPool: GameType = poolNames.reduce(
		(acc, it) => ({
			[it]: poolGames.filter((x) => x.pool_name === it),
			...acc,
		}),
		{}
	);
	const pools = poolNames.map((name) => {
		const poolData = gamesByPool[name];
		return (
			<Accordion.Item value={name} key={name}>
				<Accordion.Control>
					<Title order={3}>{name}</Title>
				</Accordion.Control>
				<Accordion.Panel>
					<TablePool name={name} data={poolData} />
				</Accordion.Panel>
			</Accordion.Item>
		);
	});
	const bracketGames = data.filter((it) => it.stage === "brackets");
	const b = "brackets";
	return (
		<ScrollArea>
			<Accordion multiple defaultValue={[b]}>
				{pools}
				<Accordion.Item value={b} key={b}>
					<Accordion.Control>
						<Title order={3}>Brackets</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<TablePool name="Brackets" data={bracketGames} />
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</ScrollArea>
	);
}
