import React from 'react';
import logo from './logo.svg';
import './App.css';
import cred from './cred.js'
const AWS = require('aws-sdk')
AWS.config.setPromisesDependency(null)
const BUCKET_NAME = 'myinsta';

const imageComponent = (src) => {
  return <td>
    <img src={src} width="300px" height="300px" />
  </td>
}
 
class App extends React.Component {
  constructor() {
    super();
    this.state = {images: []};
  }

  componentWillMount() {
    AWS.config.update(cred);
    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {"Bucket": BUCKET_NAME}
    });
    this.loadBucket();
  }

  loadBucket() {
    if(this.s3) {
      const component = this;
      let urls = [];
      this.s3.listObjects({Delimiter: '/'}, function(err, data) {
        const images = data.Contents.map((item) => item.Key);
        images.forEach((imageKey) => {
          let params = {Bucket: BUCKET_NAME, Key: imageKey, Expires: 3600};
          urls.push(new Promise((resolve, reject) => {
            component.s3.getSignedUrl('getObject', params, (err, url) => {
              err ? reject(err) : resolve(url);
            });
          }));
        })
        Promise.all(urls).then(vals => {
          component.setState({images: vals})
        })
      })
    }
  }

  imageFactory() {
    const {images} = this.state
    const gallery = [];
    for(let i=0;i<images.length; i++){
      gallery.push(imageComponent(images[i]))
    }
    return gallery;
  }

  render() {
    const test = this.imageFactory();
  return (
      <div className="App">
        <header className="App-header">
        <table>
          <tr>
        {test}
          </tr>
        </table>
        </header>
      </div>
    );
  }
}

export default App;
