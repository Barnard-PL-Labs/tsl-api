# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Use the official super-lightweight Node image.
# https://hub.docker.com/_/node
FROM ubuntu:20.04

# Create and change to the app directory.
WORKDIR /usr/src/app

ENV DEBIAN_FRONTEND noninteractive

# [START cloudrun_system_package_alpine]
# [START run_system_package_alpine]
#RUN apk --no-cache add graphviz ttf-ubuntu-font-family
RUN apt-get update -y && apt-get install -y\
  nodejs npm \
  wget git \
  && apt-get clean
# [END run_system_package_alpine]
# [END cloudrun_system_package_alpine]

RUN wget -q -O - https://www.lrde.epita.fr/repo/debian.gpg | apt-key add -
RUN echo 'deb http://www.lrde.epita.fr/repo/debian/ stable/' >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y spot
RUN apt-get install -y unzip

RUN mkdir deps-src
RUN wget -P deps-src https://github.com/cvc5/cvc5/releases/download/cvc5-1.1.1/cvc5-Linux-static.zip
RUN unzip deps-src/cvc5-Linux-static.zip -d deps-src
RUN chmod a+x deps-src/cvc5-Linux-static/bin/cvc5 
RUN mv deps-src/cvc5-Linux-static/bin/cvc5 /usr/bin

RUN apt-get install libpcre3 libpcre3-dev -y
RUN wget -qO- https://get.haskellstack.org/ | sh
RUN git clone https://github.com/Barnard-PL-Labs/tsltools
WORKDIR /usr/src/app/tsltools
RUN git reset --hard 57a1d8968e29b51e35e06deea6d2262b4ed3cefb 
RUN git clean -df
RUN stack install
RUN cp /root/.local/bin/tsl /usr/bin

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install dependencies.
# If you add a package-lock.json speed your build by switching to 'npm ci'.
# RUN npm ci --only=production
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Run the web service on container startup.
CMD [ "npm", "start" ]
