function parse(raw) {
  return raw.reduce((metrics, { ParamName, ParamValue }) => {
    if (/^\d+$/.test(ParamValue)) {
      metrics[ParamName] = parseInt(ParamValue)
    } else if (/^(true|false)$/.test(ParamValue)) {
      metrics[ParamName] = Boolean(ParamValue);
    } else {
      metrics[ParamName] = ParamValue;
    }

    return metrics;
  }, {});
}

module.exports = parse;