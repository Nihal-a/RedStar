import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const link = new HttpLink({
  uri: "http://localhost:8000/graphql/",
});

const Client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
export default Client;
