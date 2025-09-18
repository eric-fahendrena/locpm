# 📦 LOCPM

This is a CLI software that allows you to save and reuse your already installed npm packages locally.

- **Ultra-fast installation without internet** 
- **Save bandwidth and time**
- **Ideal for secure/offline environments**
- **No more panic when npm is down or removes a package**


## Installation

```bash
npm install -g locpm
```

## Usage

```
locpm [options] [command]
```
#### Example

Save all the packages installed in an existing project. Then, create a new npm project and dependencies for it.

```bash
# go to an existing project
cd existing-project
# save the dependencies
locpm save

# Let's create a new project now

cd ..
mkdir new-project
cd new-project
# initialize an npm project first
npm init -y

# installation

# install needed dependencies
locpm install pkg-a pkg-b@latest
# you can also use option
locpm install --save-dev pkg-x pkg-y@1.2.3
```