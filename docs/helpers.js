exports.lowerCase = (text) => text.toLowerCase();

exports.parseParams = (options) => {
    if (!options) {
        return;
    }

    const list = [];

    options.map((param) => {
        const nameSplit = param.name.split('.');
        let name = nameSplit[0];

        if (param.variable) name = `...${name}`;
        if (param.optional) name = `[${name}]`;

        if (!list.includes(name)) list.push(name);
    });

    const listWithSpaces = list.map((item, index) => {
        if (index > 0) {
            return ` ${item}`;
        } return item;
    });
    return listWithSpaces;
};
