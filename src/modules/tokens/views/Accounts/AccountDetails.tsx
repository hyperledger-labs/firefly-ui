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
import {
  Breadcrumbs,
  CircularProgress,
  Grid,
  Link,
  List,
  Paper,
  TablePagination,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/system';
import dayjs from 'dayjs';
import FireIcon from 'mdi-react/FireIcon';
import StamperIcon from 'mdi-react/StamperIcon';
import SwapHorizontalIcon from 'mdi-react/SwapHorizontalIcon';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { DataTable } from '../../../../core/components/DataTable/DataTable';
import { DataTableEmptyState } from '../../../../core/components/DataTable/DataTableEmptyState';
import { HashPopover } from '../../../../core/components/HashPopover';
import { NamespaceContext } from '../../../../core/contexts/NamespaceContext';
import {
  IDataTableRecord,
  ITokenAccount,
  ITokenTransfer,
} from '../../../../core/interfaces';
import { fetchWithCredentials } from '../../../../core/utils';
import { useTokensTranslation } from '../../registration';

const PAGE_LIMITS = [5, 10];

export const AccountDetails: () => JSX.Element = () => {
  const history = useHistory();
  const { t } = useTokensTranslation();
  const { poolProtocolID } = useParams<{ poolProtocolID: string }>();
  const classes = useStyles();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [loading, setLoading] = useState(false);
  const [tokenAccount, setTokenAccount] = useState<ITokenAccount>();
  const [tokenTransfers, setTokenTransfers] = useState<ITokenTransfer[]>([]);
  const [tokenTransfersTotal, setTokenTransfersTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_LIMITS[0]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    if (
      newPage > currentPage &&
      rowsPerPage * (currentPage + 1) >= tokenTransfersTotal
    ) {
      return;
    }
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentPage(0);
    setRowsPerPage(+event.target.value);
  };

  const pagination = (
    <TablePagination
      component="div"
      count={-1}
      rowsPerPage={rowsPerPage}
      page={currentPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={PAGE_LIMITS}
      labelDisplayedRows={({ from, to }) => `${from} - ${to}`}
      className={classes.pagination}
    />
  );

  useEffect(() => {
    setLoading(true);
    fetchWithCredentials(
      `/api/v1/namespaces/${selectedNamespace}/tokens/accounts?poolprotocolid=${poolProtocolID}`
    )
      .then(async (tokenAccountResponse) => {
        if (tokenAccountResponse.ok) {
          setTokenAccount((await tokenAccountResponse.json())[0]);
        } else {
          console.log('error fetching token pool');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedNamespace, poolProtocolID]);

  useEffect(() => {
    fetchWithCredentials(
      `/api/v1/namespaces/${selectedNamespace}/tokens/transfers?poolprotocolid=${poolProtocolID}&limit=${rowsPerPage}&skip=${
        rowsPerPage * currentPage
      }&count`
    )
      .then(async (tokenTransfersResponse) => {
        if (tokenTransfersResponse.ok) {
          const tokenTransfers = await tokenTransfersResponse.json();
          setTokenTransfersTotal(tokenTransfers.total);
          setTokenTransfers(tokenTransfers.items);
        } else {
          console.log('error fetching token pool');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rowsPerPage, currentPage, selectedNamespace, poolProtocolID]);

  const transferIconMap = {
    burn: <FireIcon />,
    mint: <StamperIcon />,
    transfer: <SwapHorizontalIcon />,
  };

  const tokenTransfersColumnHeaders = [
    t('txHash'),
    t('method'),
    t('amount'),
    t('from'),
    t('to'),
    t('timestamp'),
  ];

  const tokenTransfersRecords: IDataTableRecord[] = tokenTransfers.map(
    (tokenTransfer: ITokenTransfer) => ({
      key: tokenTransfer.tx.id,
      columns: [
        {
          value: (
            <Grid
              container
              direction="row"
              justifyContent="flex-start"
              alignItems="center"
            >
              <Grid item className={classes.paddingRight}>
                {transferIconMap[tokenTransfer.type]}
              </Grid>
              <Grid item>
                <HashPopover
                  shortHash={true}
                  textColor="primary"
                  address={tokenTransfer.tx.id}
                />
              </Grid>
            </Grid>
          ),
        },
        { value: t(tokenTransfer.type) },
        { value: tokenTransfer.amount },
        {
          value: tokenTransfer.from ? (
            <HashPopover
              shortHash={true}
              textColor="primary"
              address={tokenTransfer.from}
            />
          ) : (
            '---'
          ),
        },
        {
          value: tokenTransfer.to ? (
            <HashPopover
              shortHash={true}
              textColor="primary"
              address={tokenTransfer.to}
            />
          ) : (
            '---'
          ),
        },
        { value: dayjs(tokenTransfer.created).format('MM/DD/YYYY h:mm A') },
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

  if (!tokenAccount) {
    return <></>;
  }

  const detailsData = [
    { label: t('poolProtocolID'), value: t(tokenAccount.poolProtocolId) },
    {
      label: t('tokenIndex'),
      value: tokenAccount.tokenIndex ? t(tokenAccount.tokenIndex) : '---',
    },
    { label: t('connector'), value: tokenAccount.connector },
    {
      label: t('key'),
      value: <HashPopover address={tokenAccount.key}></HashPopover>,
    },
    { label: t('balance'), value: tokenAccount.balance },
    {
      label: t('updated'),
      value: dayjs(tokenAccount.updated).format('MM/DD/YYYY h:mm A'),
    },
  ];

  return (
    <Grid container justifyContent="center">
      <Grid container item wrap="nowrap" direction="column">
        <Grid item>
          <Breadcrumbs className={classes.paddingBottom}>
            <Link
              underline="hover"
              color="inherit"
              sx={{ cursor: 'pointer' }}
              onClick={() =>
                history.push(`/namespace/${selectedNamespace}/tokens/accounts/`)
              }
            >
              {t('accounts')}
            </Link>
            <Link underline="none" color="text.primary">
              {t('accountDetails')}
            </Link>
          </Breadcrumbs>
        </Grid>
        <Box className={classes.separator} />
        <Grid
          item
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="center"
          className={classes.paddingBottom}
        >
          <Typography className={classes.bold} variant="h4">
            {t('accountDetails')}
          </Typography>
        </Grid>
        <Grid container spacing={4} item direction="row">
          <Grid item xs={6}>
            <Paper className={classes.paper}>
              <Grid
                container
                justifyContent="space-between"
                direction="row"
                className={classes.paddingBottom}
              >
                <Grid item>
                  <Typography className={classes.header}>
                    {t('details')}
                  </Typography>
                </Grid>
              </Grid>
              <List>
                <Grid container spacing={2}>
                  {detailsData.map((data) => {
                    return (
                      <React.Fragment key={data.label}>
                        <Grid item xs={4}>
                          <Typography color="text.secondary" variant="body1">
                            {data.label}
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography>{data.value}</Typography>
                        </Grid>
                      </React.Fragment>
                    );
                  })}
                </Grid>
              </List>
            </Paper>
          </Grid>
          <Grid container item>
            {tokenTransfers.length ? (
              <DataTable
                header={t('transferHistory')}
                minHeight="300px"
                maxHeight="calc(100vh - 340px)"
                columnHeaders={tokenTransfersColumnHeaders}
                records={tokenTransfersRecords}
                {...{ pagination }}
              />
            ) : (
              <DataTableEmptyState
                message={t('noTokenTransfersToDisplay')}
              ></DataTableEmptyState>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

const useStyles = makeStyles((theme) => ({
  centeredContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 300px)',
    overflow: 'auto',
  },
  header: {
    fontWeight: 'bold',
  },
  paper: {
    width: '100%',
    height: '100%',
    padding: theme.spacing(3),
  },
  separator: {
    flexGrow: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  paddingBottom: {
    paddingBottom: theme.spacing(2),
  },
  paddingRight: {
    paddingRight: theme.spacing(2),
  },
  pagination: {
    color: theme.palette.text.secondary,
  },
}));
