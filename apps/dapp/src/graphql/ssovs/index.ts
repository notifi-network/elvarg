import { graphql } from 'gql/ssovs';

export const getSsovPurchasesFromTimestampDocument = graphql(`
  query getSsovPurchasesFromTimestamp($fromTimestamp: BigInt!) {
    ssovoptionPurchases(
      where: { transaction_: { timestamp_gt: $fromTimestamp } }
    ) {
      ssov {
        id
      }
      amount
    }
  }
`);

export const getSsovUserDataDocument = graphql(`
  query getSsovUserData($user: ID!) {
    users(where: { id: $user }) {
      id
      userPositions {
        id
        epoch
        strike
        amount
      }
      userSSOVDeposit {
        id
        transaction {
          id
        }
        user {
          id
        }
        sender
        epoch
        strike
        amount
        ssov {
          id
        }
      }
      userSSOVOptionBalance {
        id
        transaction {
          id
        }
        epoch
        strike
        user {
          id
        }
        sender
        amount
        fee
        premium
        ssov {
          id
        }
      }
    }
  }
`);