import React, { useState, useEffect, useContext } from 'react';
import { DisplaySlide } from './Display/DisplaySlide';
import {
  Typography,
  Grid,
  Divider,
  Button,
  makeStyles,
  Box,
  CircularProgress,
} from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import { IMessage, IBatch } from '../interfaces';
import { HashPopover } from './HashPopover';
import dayjs from 'dayjs';
import CopyToClipboard from 'react-copy-to-clipboard';
import clsx from 'clsx';
import { NamespaceContext } from '../contexts/NamespaceContext';
import { useHistory } from 'react-router-dom';

interface Props {
  message: IMessage;
  open: boolean;
  onClose: () => void;
}

export const MessageDetails: React.FC<Props> = ({ message, open, onClose }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string>();
  const { selectedNamespace } = useContext(NamespaceContext);

  const detailItem = (label: string, value: string | JSX.Element) => (
    <>
      <Grid item xs={12}>
        <Typography className={classes.detailLabel}>{label}</Typography>
      </Grid>
      <Grid item xs={12}>
        {value}
      </Grid>
    </>
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/namespaces/${selectedNamespace}/batches/${message.batchID}`)
      .then(async (response) => {
        if (response.ok) {
          const batch: IBatch = await response.json();
          setTxId(batch.payload.tx.id);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [message.batchID, selectedNamespace]);

  const copyableHash = (hash: string) => (
    <Grid alignItems="center" container direction="row">
      <Grid item xs={8}>
        <Typography
          title={hash}
          noWrap
          className={clsx(classes.detailValue, classes.paddingRight)}
        >
          {hash}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <CopyToClipboard text={hash}>
          <Button size="small" className={classes.copyButton}>
            {t('copy')}
          </Button>
        </CopyToClipboard>
      </Grid>
    </Grid>
  );

  const pinned = (txType: string, txId: string | undefined) => (
    <Grid alignItems="center" container direction="row" justify="space-between">
      <Grid item xs={8}>
        <Typography
          noWrap
          className={clsx(classes.detailValue, classes.paddingRight)}
        >
          {txType === 'pin' ? t('yes') : t('no')}
        </Typography>
      </Grid>
      {txId && (
        <Grid item xs={4}>
          <Button
            size="small"
            className={classes.copyButton}
            onClick={() =>
              history.push(`/transactions/${txId}`, {
                props: { message: message, open: open },
              })
            }
          >
            {t('viewTx')}
          </Button>
        </Grid>
      )}
    </Grid>
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
      <DisplaySlide open={open} onClose={onClose}>
        <Grid container direction="column">
          <Grid className={classes.headerContainer} item>
            <Typography className={classes.header}>
              {t('messageDetail')}
            </Typography>
          </Grid>
          <Grid
            className={classes.detailsContainer}
            container
            item
            direction="row"
          >
            <Grid className={classes.detailItem} sm={12} md={6} container item>
              {detailItem(t('id'), <HashPopover address={message.header.id} />)}
            </Grid>
            <Grid className={classes.detailItem} sm={12} md={6} container item>
              {detailItem(t('topic'), message.header.topic)}
            </Grid>
            <Grid className={classes.detailItem} sm={12} md={6} container item>
              {detailItem(t('type'), message.header.type)}
            </Grid>
            <Grid className={classes.detailItem} sm={12} md={6} container item>
              {detailItem(t('context'), message.header.context)}
            </Grid>
            <Grid className={classes.detailItem} sm={12} md={6} container item>
              {detailItem(
                t('author'),
                <HashPopover address={message.header.author} />
              )}
            </Grid>
            <Grid className={classes.detailItem} sm={12} md={6} container item>
              {detailItem(
                t('createdOn'),
                dayjs(message.header.created).format('MM/DD/YYYY h:mm A')
              )}
            </Grid>
          </Grid>
          <Divider className={classes.divider} />
          <Grid
            className={classes.detailsContainer}
            container
            item
            direction="row"
          >
            <Grid className={classes.detailItem} sm={12} container item>
              {detailItem(t('pinned?'), pinned(message.header.tx.type, txId))}
            </Grid>
            <Grid className={classes.detailItem} sm={12} container item>
              {detailItem(t('dataHash'), copyableHash(message.header.datahash))}
            </Grid>
          </Grid>
        </Grid>
      </DisplaySlide>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  detailsContainer: {
    padding: theme.spacing(3),
  },
  detailItem: {
    paddingBottom: theme.spacing(1),
  },
  header: {
    fontWeight: 'bold',
  },
  headerContainer: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(3),
  },
  detailLabel: {
    fontSize: 10,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
  },
  divider: {
    backgroundColor: theme.palette.background.default,
    height: 2,
  },
  copyButton: {
    backgroundColor: theme.palette.primary.dark,
    borderRadius: 20,
    fontSize: 10,
  },
  paddingRight: {
    paddingRight: theme.spacing(1),
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
