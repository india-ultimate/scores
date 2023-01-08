import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import React, { useState, useEffect } from "react";
import { Table, Select, Typography, List } from "antd";
import type { ColumnsType } from 'antd/es/table';

interface DataType {
    team_a: string;
    score_a: number;
    team_b: string;
    score_b: number;
}

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
                setTournaments(data.map((it: Tournament) => ({ value: it.slug, label: it.name })));
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

    const getLink = (sheetId: string) => {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/`
        return <a target="_blank" rel="noopener noreferrer" href={url}>{url}/</a>
    }

    const displayList = (metadata: Tournament) => {
        const displayKeys = new Set(['sheet_id', 'date', 'venue', 'division'])
        return Object.entries(metadata).filter((it) => displayKeys.has(it[0])).map((entry) => {
            const [_key, _value] = entry
            const value = _key === 'sheet_id' ? getLink(_value) : _value
            const key = _key === 'sheet_id' ? 'source' : _key
            return { value, key }
        })
    }

    const columns: ColumnsType<DataType> = [
        {
            title: "Team",
            dataIndex: "team_a",
            key: "team_a"
        },
        {
            title: "Score",
            dataIndex: "score_a",
            key: "score_a"
        },
        {
            title: "Score",
            dataIndex: "score_b",
            key: "score_b"
        },
        {
            title: "Team",
            dataIndex: "team_b",
            key: "team_b"
        }
    ];

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
                            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
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
                        onChange={selectTournament}
                        options={tournaments}
                    />

                    {metadata.name.length > 0 && <List
                        header={<Typography.Title level={1}>{metadata.name}</Typography.Title>}
                        bordered
                        dataSource={displayList(metadata)}
                        renderItem={(item) => (
                            <List.Item>
                                <Typography.Text italic>{item.key}</Typography.Text>: {item.value}
                            </List.Item>
                        )}

                    />}
                    {scores.length > 0 && <Table columns={columns} dataSource={scores} pagination={false} />}
                </div>
            </main>
        </>
    );
}
