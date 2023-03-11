import React from "react"
import { render } from "react-dom"
import { LabelImgProvider } from "./label-img-provider"
import Control from "./control"
import { StoreProvider } from "./store-provider"
import Listener from "./listener"
import { CreateInstance } from "./instance"
import { Row, Layout } from "antd"
import "./app.less"
import {BrowserRouter, Routes, Route } from "react-router-dom";
const { Header, Footer } = Layout;

const Main = () => {
  return (
    <StoreProvider>
      <LabelImgProvider>
          <Header className="header">
              <div className="logo">
                  <a href="/">FastLabel 标注平台</a>
              </div>
          </Header>
        <div className="pw">
          <Row justify="center">
            <CreateInstance />
            <Control />
            <Listener />
          </Row>
        </div>
      </LabelImgProvider>
    </StoreProvider>
  )
}

// 用来作为 404 页面的组件
const NotFound = () => {
  return <div>你来到了没有知识的荒原</div>
}

class App extends React.Component {
  render() {
      return (
          <BrowserRouter>
              <div className="views">
                  <Routes>
                      <Route path="/" element={<Main/>}/>
                      <Route path="*" element={<NotFound/>}/>
                  </Routes>
              </div>
          </BrowserRouter>
      );
  }
}

render(<App />, document.getElementById("app"))
