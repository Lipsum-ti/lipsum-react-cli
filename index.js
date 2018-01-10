#!/usr/bin/env node

// Imports
const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const fsExtra = require('fs-extra');
const progress = require('progress');
const path = require('path');
const upperCamelCase = require('uppercamelcase');
const spawn = require('cross-spawn');

// Globals
const sep = path.sep;
const cwd = process.cwd();

function mkdirp(targetDir) {
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    return curDir;
  }, initDir);
}

function createComponent(name, functional) {
  console.log('Attempting to create component: ' + chalk.bold(name));
  const componentDir = '/src/components/' + name;
  mkdirp(process.cwd() + componentDir);
  console.log('Successfully created ' + chalk.green.bold(componentDir) + ' directory.')
  const imports = "import React, { Component } from 'react'\nimport PropTypes from 'prop-types'\n\nimport './" + name + ".scss'\n\n"
  const imports_f = "import React from 'react'\nimport PropTypes from 'prop-types'\n\nimport './" + name + ".scss'\n\n"
  const declare = "class " + name + " extends Component {\n  render() {\n    const { prop } = this.props\n    return (\n      <div>\n        {prop}\n      </div>\n    )\n  }\n}\n\n";
  const declare_f = "const " + name + " = ({ prop }) => (\n  <div>\n    {prop}\n  </div>\n)\n\n";
  const propTypes = name + ".propTypes = {\n  prop: PropTypes.string,\n}\n\n" + name + ".defaultProps = {\n  prop: '',\n}\n\n";
  const __export = "export default " + name + "\n";
  const fileContents = (functional ? imports_f + declare_f : imports + declare) + propTypes + __export;
  const jsfile = componentDir + '/' + name + '.js';
  fs.writeFileSync(process.cwd() + jsfile, fileContents);
  console.log('Successfully created ' + chalk.green.bold(jsfile) + ' file.');
  const scssfile = componentDir + '/' + name + '.scss';
  fs.writeFileSync(process.cwd() + scssfile, '');
  console.log('Successfully created ' + chalk.green.bold(scssfile) + ' file.');
}

function createService(name, baseURL) {
  console.log('Attempting to create service: ' + chalk.bold(name));
  const serviceDir = '/src/services/' + name;
  mkdirp(process.cwd() + serviceDir);
  console.log('Successfully created ' + chalk.green.bold(serviceDir) + ' directory.')
  const imports = "import axios from 'axios'\n\n"
  const declare = "const " + name + "Service = axios.create({\n  baseURL: '" + baseURL + "',\n})\n\n";
  const __export = "export default " + name + "Service\n";
  const fileContents = imports + declare + __export;
  const jsfile = serviceDir + '/' + name + 'Service.js';
  fs.writeFileSync(process.cwd() + jsfile, fileContents);
  console.log('Successfully created ' + chalk.green.bold(jsfile) + ' file.');
}

function createContainer(name, hasComponent, hasService) {
  console.log('Attempting to create container: ' + chalk.bold(name));
  const containerDir = '/src/containers/' + name;
  mkdirp(process.cwd() + containerDir);
  console.log('Successfully created ' + chalk.green.bold(containerDir) + ' directory.')
  const imports = "import React, { Component } from 'react'\n" + ((hasComponent) ? ("import " + name + " from 'components/" + name + "'\n") : "") + ((hasService) ? ("import " + name + "Service from 'services/" + name + "'\n") : "");
  const declare = "\nclass " + name + "Container extends Component {\n  constructor(props) {\n    super(props)\n    this.state = {\n\n    }\n  }\n\n  render() {\n    return (" + ((hasComponent) ? ("<" + name + " />") : "<div>Hi!</div>") + ")\n  }\n}\n\n";
  const __export = "export default " + name + "Container\n";
  const fileContents = imports + declare + __export;
  const jsfile = containerDir + '/' + name + '.js';
  fs.writeFileSync(process.cwd() + jsfile, fileContents);
  console.log('Successfully created ' + chalk.green.bold(jsfile) + ' file.')
}

program
  .command('component <name>')
  .description('Creates a new component under src/components')
  .option('-f, --functional','Creates the component as a functional component')
  .action(function (name,options) {
    name = upperCamelCase(name);
    const functional = options.functional || false;
    createComponent(name, functional);
  });

program
  .command('service <name> [baseURL]')
  .description('Creates a new axios service under src/services')
  .action(function (name, baseURL) {
    name = upperCamelCase(name);
    baseURL = (baseURL === undefined) ? '' : baseURL;
    createService(name, baseURL);
  });

program
  .command('container <name>')
  .description('Creates a new container under src/containers')
  .option('-c, --component', 'Creates a corresponding component under src/components.')
  .option('-f, --functionalComponent', 'Creates a corresponding functional component under src/components.')
  .option('-s, --service [baseURL]', 'Creates a corresponding axios service under src/services')
  .action(function (name, options) {
    name = upperCamelCase(name);
    const component = options.component || false;
    const functional = options.functionalComponent || false;
    const hasComponent = component || functional;
    const hasService = (options.service !== undefined);
    const baseURL = (hasService == true && options.service === true) ? '' : options.service;
    if (functional && component) {
      console.log(chalk.red('You cannot use both --component and --functionalComponent flags at the same time'));
      process.exit(1);
    }
    createContainer(name, hasComponent, hasService);
    if (hasComponent) {
      createComponent(name, functional);
    }
    if (hasService) {
      createService(name, baseURL);
    }
  });

program
  .command('init [dependencies...]')
  .option('-w,--webpack', 'Use this to create the project with webpack')
  .description('Creates a new React project')
  .action(function (dependencies, options) {
    const webpack = options.webpack || false;
    spawn.sync('npm', ['init'], { stdio: 'inherit' });
    const appPackage = require(path.join(process.cwd(), 'package.json'));
    appPackage.dependencies = {
      "axios": "^0.17.1",
      "react": "^16.2.0",
      "react-dom": "^16.2.0",
      "react-router-dom": "^4.2.2"
    }
    if(dependencies){
      dependencies.forEach(function(dep){
        try {
          spawn.sync('npm', ['install', dep]);
        } catch (error) {
          console.log(chalk.red('Couldn\'t install ' + dep));
        }
      })
    }
    if (webpack) {
      const appPackage = require(path.join(process.cwd(), 'package.json'));
      appPackage.dependencies = appPackage.dependencies || {};
      appPackage.scripts = {
        test: "echo \"Error: no test specified\" && exit 1",
        build: "webpack --config webpack.prod.js",
        watch: "webpack --config webpack.prod.js --watch",
        start: "webpack-dev-server --hot --inline --config webpack.dev.js"
      };
      appPackage.devDependencies = {
        "babel": "^6.23.0",
        "babel-core": "^6.26.0",
        "babel-eslint": "^8.1.2",
        "babel-loader": "^7.1.2",
        "babel-plugin-add-module-exports": "^0.2.1",
        "babel-preset-env": "^1.6.1",
        "babel-preset-react": "^6.24.1",
        "babel-preset-stage-1": "^6.24.1",
        "clean-webpack-plugin": "^0.1.17",
        "css-loader": "^0.28.7",
        "csv-loader": "^2.1.1",
        "directory-named-webpack-plugin": "^2.3.0",
        "eslint": "^4.13.1",
        "eslint-config-airbnb": "^16.1.0",
        "eslint-loader": "^1.9.0",
        "eslint-plugin-import": "^2.8.0",
        "eslint-plugin-jsx-a11y": "^6.0.3",
        "eslint-plugin-react": "^7.5.1",
        "extract-text-webpack-plugin": "^3.0.2",
        "favicons-webpack-plugin": "0.0.7",
        "file-loader": "^1.1.5",
        "html-webpack-plugin": "^2.30.1",
        "node-sass": "^4.7.2",
        "sass-loader": "^6.0.6",
        "style-loader": "^0.19.1",
        "uglifyjs-webpack-plugin": "^1.1.4",
        "webpack": "^3.10.0",
        "webpack-config": "^7.5.0",
        "webpack-dev-server": "^2.9.7",
        "webpack-encoding-plugin": "^0.2.1",
        "webpack-merge": "^4.1.1",
        "xml-loader": "^1.2.1"
      }
      fsExtra.copy(path.join(process.env._,'../../lib/node_modules/lipsum-react-cli/template'), process.cwd()).then();
    }else{
      createComponent('App',false);
      fs.copyFileSync(path.join(process.env._,'../../lib/node_modules/lipsum-react-cli/template/src/index.js'), process.cwd() + '/src/index.js');
      fs.copyFileSync(path.join(process.env._,'../../lib/node_modules/lipsum-react-cli/template/src/style.css'), process.cwd() + '/src/style.css');
    }
    fs.writeFileSync(
      path.join(process.cwd(), 'package.json'),
      JSON.stringify(appPackage, null, 2)
    );
    console.log('Project successfully created!\n');
    console.log(chalk.bold('Now you have to run ') + chalk.bold.green('npm install ') + chalk.bold('or ') + chalk.bold.green('yarn install') + chalk.bold(' in order to complete the installation process.'));
  });

program.parse(process.argv);
