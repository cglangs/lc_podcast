import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './components/App'
import * as serviceWorker from './serviceWorker';
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { BrowserRouter } from 'react-router-dom'
import { setContext } from 'apollo-link-context'
import { getToken } from './constants'

/*const cache = cacheExchange({
  updates: {
    Mutation: {
      CreateSentence: (result, args, cache, info) => {
        cache.updateQuery({ query: GET_LEVEL_WORDS}, data => {
          if (data !== null) {
            //if interval == 1
            let index = data.Author[0].level.teachable_words.findIndex((word) => word.text === result.AddSentenceWord_taught.to.text)
            data.Author[0].level.addable_words.push(data.Author[0].level.teachable_words[index])
            data.Author[0].level.teachable_words.splice(index, 1);

            return data
          } else {
            return null
          }
        })
      }
    }
  }
})*/



const httpLink = createHttpLink({
  uri: 'http://0.0.0.0:3003'
})


const authLink = setContext((_, { headers }) => {
  const token = getToken()
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

// 3
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
})

// 4
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
serviceWorker.unregister();

