# process-top

A "top" like module for your Node.js process. Collects CPU usage etc.

```
npm install process-top
```

## Usage

``` js
const top = require('process-top')()

setInterval(function () {
  // Prints out a string containing stats about your Node.js process.
  console.log(top.toString())
}, 1000)
```

Running the above will print something similar to:

```
cpu: 0.4% | rss: 32 MB (0.2%) | heap: 5.1 MB / 8.1 MB (63.5%) | ext: 8.8 KB | delay: 0 ms | 00:00:52 | loadavg: 0.52, 0.37, 0.31
```

* `cpu` is cpu usage by the process in the last ~5s.
* `rss` is how much `rss` memory Node has allocated out of your total memory.
* `heap` is how much heap you are using vs total heap.
* `ext` is how much external memory Node.js is using (ie, Buffers etc).
* `delay` is event loop delay the last ~5s.
* `00:00:00` is the runtime of the process
* `loadavg` is the current loadavg of the machine.

## API

#### `top = processTop()`

Create a new process top object.

#### `top.cpu()`

Returns a CPU stats object.

#### `top.memory()`

Returns a memory stats object.

#### `top.delay()`

Returns the event loop delay.

#### `top.runtime()`

Returns the runtime in ms.

#### `top.loadavg()`

Returns the load average of the machine.

#### `top.toString()`

Returns a human friendly string representation of the top object.

#### `top.destroy()`

Destroy the top object.

#### `top.toJSON()`

Return the stats as JSON.

## CLI

There is also a CLI tool available.

```
npm install -g process-top
process-top my-cool-program.js
```

The CLI will print a `top.toString()` line every 1s the program is running.

## License

MIT
