import App, { Container } from 'next/app';
import Page from '../components/Page';

// myapp is going to wrap our app at the highest level with Container from next.js
// Component that we are taking from props is going to be our pages, ie. index.js, sell.js etc.
//

class MyApp extends App {
  render () {
    const { Component } = this.props
    return (
      <Container>
        <Page>
          <Component />
        </Page>
      </Container>
    )
  }
}

export default MyApp;