import React from 'react';
import logo from './logo.svg';
import './App.css';
import cred from './cred.js'
import Dropzone from 'react-dropzone'
const AWS = require('aws-sdk')
AWS.config.setPromisesDependency(null)
const BUCKET_NAME = 'myinsta';

const imageComponent = (src) => {
  return <td>
    <img src={src} width="300px" height="300px" alt=''/>
  </td>
}

const imageRow = (images) => {
  return <tr>
    {images}
  </tr>
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
    let gallery = [];
    const rowGallery = [];
    images.forEach((image) => gallery.push(imageComponent(image)))
    while(gallery.length > 4){
      rowGallery.push(imageRow(gallery.slice(0,4)));
      gallery = gallery.slice(4);
    }
    rowGallery.push(imageRow(gallery));
    return rowGallery;
  }

  uploadFile(files) {
    if(this.s3) {
      const component = this;
      files.forEach(file => {
        const {name, type} = file;
        if(!type.startsWith('image/')){
          return
        }
        const params = {Body: file, Bucket: BUCKET_NAME, Key: name}
        this.s3.putObject(params).promise().then(val => {
          const getObjectParams = {Bucket: BUCKET_NAME, Key: name}
          component.s3.getSignedUrl('getObject', getObjectParams, (err, url) => {
          const {images} = component.state;
          const newImages = images.concat([url]);
          component.setState({images: newImages}) 
          })
        })
      })
    }
  }

  render() {
    const test = this.imageFactory();
  return (
      <div className="App">
        <header className="App-header">
        <Dropzone onDrop={this.uploadFile.bind(this)}>
          {({getRootProps, getInputProps}) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className='Dropzone-style'>
                  Drag 'n' drop some files here, or click to select files
                </div>
              </div>
            </section>
          )}
        </Dropzone>
        <table>
        {test}
        </table>
        </header>
      </div>
    );
  }
}

export default App;
