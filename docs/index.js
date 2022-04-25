<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>TSL Synth</title>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <script>
      axios
        .get("https://graphviz-web-vvxsiayuzq-ue.a.run.app/tslsynth?tsl="+tslSpec)
        .then(response => {
          console.log(response.data);
        })
        .catch(error => console.error(error));
    </script>
  </head>

  <body></body>
</html>
