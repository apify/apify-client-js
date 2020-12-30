exports.lowerCase = (text) => text.toLowerCase();

exports.params = function params(options) {
    if (this.params) {
        const list = this.params.map((param) => {
            const nameSplit = param.name.split('.');
            let name = nameSplit[nameSplit.length - 1];
            if (param.variable) name = `...${name}`;
            if (param.optional) name = `[${name}]`;
            return {
                indent: '    '.repeat(nameSplit.length - 1),
                name,
                type: param.type,
                optional: param.optional,
                defaultvalue: param.defaultvalue,
                description: param.description,
            };
        });
        return options.fn(list);
    }
};
