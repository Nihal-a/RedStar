import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  gql,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";

const httpLink = new HttpLink({
  uri: "http://redstarpunnathala.in/api/graphql/",
  credentials: "include", // important for cookies
});

// Refresh mutation (Django will use HttpOnly cookie)
const REFRESH_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      token
      payload
    }
  }
`;

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (newToken) => {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
};

const errorLink = new ErrorLink(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      if (err.message === "Signature has expired") {
        if (!isRefreshing) {
          isRefreshing = true;

          client
            .mutate({
              mutation: REFRESH_MUTATION,
              context: { fetchOptions: { credentials: "include" } },
            })
            .then(({ data }) => {
              const newToken = data.refreshToken.token;
              localStorage.setItem("token", newToken);

              isRefreshing = false;
              resolvePendingRequests(newToken);
            })
            .catch(() => {
              isRefreshing = false;
              pendingRequests = [];
              localStorage.clear();
              window.location.href = "/signin";
            });
        }

        return new Promise((resolve) => {
          pendingRequests.push((newToken) => {
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                Authorization: `JWT ${newToken}`,
              },
            }));
            resolve(forward(operation));
          });
        });
      }
    }
  }
});

// Auth link: always attach latest token
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("token");
  if (token) {
    operation.setContext({
      headers: {
        Authorization: `JWT ${token}`,
      },
    });
  }
  return forward(operation);
});

// Build client
const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
