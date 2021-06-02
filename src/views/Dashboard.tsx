// Copyright © 2021 Kaleido, Inc.
//
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useState, useContext } from 'react';
import {
  Grid,
  makeStyles,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
} from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import { IDataTableRecord, IMessage, ITransaction } from '../interfaces';
import { DataTable } from '../components/DataTable/DataTable';
import dayjs from 'dayjs';
import { HashPopover } from '../components/HashPopover';
import { NamespaceContext } from '../contexts/NamespaceContext';
import { RecentTransactions } from '../components/RecentTransactions/RecentTransactions';

export const Dashboard: React.FC = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [txSequence, setTxSequence] = useState<ITransaction[]>([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const { selectedNamespace } = useContext(NamespaceContext);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/v1/namespaces/${selectedNamespace}/messages?limit=5`),
      fetch(`/api/v1/namespaces/${selectedNamespace}/transactions?limit=1`),
      fetch(
        `/api/v1/namespaces/${selectedNamespace}/transactions?created=>=${dayjs()
          .subtract(1, 'day')
          .unix()}`
      ),
    ])
      .then(async ([messageResponse, txSequenceResponse, txResponse]) => {
        if (messageResponse.ok && txSequenceResponse.ok && txResponse.ok) {
          setMessages(await messageResponse.json());
          setTransactions(await txResponse.json());
          // use most recent tx to determine sequence number, which tells us total # of tx's
          setTxSequence(await txSequenceResponse.json());
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedNamespace]);

  const summaryPanel = (label: string, value: string | number) => (
    <Card>
      <CardContent className={classes.content}>
        <Typography noWrap className={classes.summaryLabel}>
          {label}
        </Typography>
        <Typography noWrap className={classes.summaryValue}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const messageColumnHeaders = [
    t('author'),
    t('type'),
    t('dataHash'),
    t('createdOn'),
  ];

  const messageRecords: IDataTableRecord[] = messages.map(
    (message: IMessage) => ({
      key: message.header.id,
      columns: [
        {
          value: (
            <HashPopover
              textColor="secondary"
              address={message.header.author}
            />
          ),
        },
        {
          value: message.header.type,
        },
        {
          value: (
            <HashPopover
              textColor="secondary"
              address={message.header.datahash}
            />
          ),
        },
        {
          value: dayjs(message.header.created).format('MM/DD/YYYY h:mm A'),
        },
      ],
    })
  );

  if (loading) {
    return (
      <Box className={classes.centeredContent}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Grid container wrap="nowrap" className={classes.root} direction="column">
        <Grid className={classes.headerContainer} item>
          <Typography variant="h4" className={classes.header}>
            {t('explorer')}
          </Typography>
        </Grid>
        <Grid
          className={classes.cardContainer}
          spacing={4}
          container
          item
          direction="row"
        >
          <Grid xs={6} sm={4} item>
            {summaryPanel(
              t('networkMembers'),
              Math.floor(Math.random() * 1000)
            )}
          </Grid>
          <Grid xs={6} sm={4} item>
            {summaryPanel(
              t('messages'),
              messages.length !== 0 ? messages[0].sequence : 0
            )}
          </Grid>
          <Grid xs={6} sm={4} item>
            {summaryPanel(
              t('transactions'),
              txSequence.length !== 0 ? txSequence[0].sequence : 0
            )}
          </Grid>
        </Grid>
        <Grid container item direction="row" spacing={6}>
          <Grid container item xs={7}>
            <DataTable
              minHeight="300px"
              maxHeight="calc(100vh - 340px)"
              columnHeaders={messageColumnHeaders}
              records={messageRecords}
              header={t('latestMessages')}
            />
          </Grid>
          <Grid container item xs={5}>
            <RecentTransactions transactions={transactions} />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: 20,
    paddingLeft: 120,
    paddingRight: 120,
    [theme.breakpoints.down('sm')]: {
      flexWrap: 'wrap',
    },
  },
  header: {
    fontWeight: 'bold',
  },
  headerContainer: {
    marginBottom: theme.spacing(5),
  },
  summaryLabel: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 32,
  },
  content: {
    padding: theme.spacing(3),
  },
  cardContainer: {
    paddingBottom: theme.spacing(4),
  },
  centeredContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 300px)',
    overflow: 'auto',
  },
}));
