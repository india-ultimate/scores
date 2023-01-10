import { useState } from "react";
import {
  createStyles,
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  TextInput
} from "@mantine/core";
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch
} from "@tabler/icons";

const useStyles = createStyles(theme => ({
  th: {
    padding: "0 !important"
  },

  control: {
    width: "100%",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0]
    }
  },

  icon: {
    width: 21,
    height: 21,
    borderRadius: 21
  }
}));

interface RowData {
  team_a: string;
  score_a: number;
  team_b: string;
  score_b: number;
  stage: string;
}

interface TableScoresProps {
  data: RowData[];
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

function filterData(data: RowData[], search: string) {
  const query = search.toLowerCase().trim();
  const searchFields: Array<keyof RowData> = ["team_a", "team_b"];
  return data.filter(item =>
    searchFields.some(key =>
      (item[key] as string).toLowerCase().includes(query)
    )
  );
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return (b[sortBy] as string).localeCompare(a[sortBy] as string);
      }

      return (a[sortBy] as string).localeCompare(b[sortBy] as string);
    }),
    payload.search
  );
}

export function TableScores({ data }: TableScoresProps) {
  const [search, setSearch] = useState("");
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(
      sortData(data, { sortBy, reversed: reverseSortDirection, search: value })
    );
  };

  const rows = sortedData.map((row, index) => {
    return (
      <tr
        key={index}
        style={{ backgroundColor: row.stage === "brackets" ? "lightblue" : "" }}
      >
        <td>{row.team_a}</td>
        <td>{row.score_a}</td>
        <td>{row.score_b}</td>
        <td>{row.team_b}</td>
      </tr>
    );
  });

  return (
    <ScrollArea>
      <TextInput
        placeholder="Search by Team name"
        mb="md"
        icon={<IconSearch size={14} stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      />
      <Table
        horizontalSpacing="lg"
        verticalSpacing="xs"
        sx={{ tableLayout: "fixed" }}
      >
        <thead>
          <tr>
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
