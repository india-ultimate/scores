import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import React, { useState, useEffect } from "react";
import { Select, Title, Grid, Card, Text } from "@mantine/core";
import { TableScores } from "../components/TableScores";

interface Tournament {
  slug: string;
  name: string;
}

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [scores, setScores] = useState([]);
  const [metadata, setMetadata] = useState({ slug: "", name: "" });

  useEffect(() => {
    fetch("/data/tournaments.json")
      .then(response => response.json())
      .then(data => {
        setTournaments(
          data.map((it: Tournament) => ({ value: it.slug, label: it.name }))
        );
      });
  }, []);

  const selectTournament = (name: string) => {
    setScores([]);
    fetch(`/data/${name}.json`)
      .then(response => response.json())
      .then(tournament => {
        const { data, ...metadata } = tournament;
        setScores(data);
        setMetadata(metadata);
      });
  };

  const getLink = (url: string) => {
    return (
      <a target="_blank" rel="noopener noreferrer" href={url}>
        {url}
      </a>
    );
  };

  const getSheetLink = (sheetId: string) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/`;
    return getLink(url);
  };

  const displayList = (metadata: Tournament) => {
    const displayKeys = new Set([
      "sheet_id",
      "date",
      "venue",
      "division",
      "photos"
    ]);
    return Object.entries(metadata)
      .filter(it => displayKeys.has(it[0]))
      .map(entry => {
        const [_key, _value] = entry;
        const value =
          _key === "sheet_id"
            ? getSheetLink(_value)
            : _key === "photos" ? getLink(_value) : _value;
        const key = _key === "sheet_id" ? "source" : _key;
        return { value, key };
      });
  };

  return (
    <>
      <Head>
        <title>India Ultimate Scores</title>
        <meta name="description" content="Generated by India Ultimate scores" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <p>Scores for India Ultimate Tournaments</p>
          <div>
            <a
              href="https://indiaultimate.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              By{" "}
              <Image
                src="https://d36m266ykvepgv.cloudfront.net/uploads/media/o4G97mT9vR/s-448-250/upai-2.png"
                alt="Vercel Logo"
                className={styles.vercelLogo}
                width={112}
                height={62}
                priority
              />
            </a>
          </div>
        </div>
        <div className={styles.content}>
          <Select
            className={styles.tournamentSelector}
            placeholder="select tournament"
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
              {displayList(metadata).map(item => (
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
          {scores.length > 0 && <TableScores data={scores} />}
        </div>
        <div className={styles.card}>
          <a
            href="https://github.com/india-ultimate/scores/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built
          </a>{" "}
          with 💙 in Bengaluru
        </div>
      </main>
    </>
  );
}
