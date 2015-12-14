var CurrencyConverter = {
    init: function(elem, options) {
        var _this = this;
        _this.elem = elem;
        _this.$elem = $(elem);

        _this.settings = $.extend({}, _this.defaults, options);

        _this.writeOptions();

        if (_this.settings.appId !== null && typeof _this.settings.appId === 'string') {
            _this.promiseObj = _this._makeRequest(_this.settings.appId);
        } else {
            _this.$elem.append("<em class='me-warns'>Missing App Id - Please provide your Open Exchange Rates App Id</em>")
        }

        _this.promiseObj.done(function(result, xhr){
            var rate, output;

            rate = _this.getRate(result.rates);

            _this.displayInfo(result);

            _this.$elem.on('change', 'select', function() {
                rate = _this.getRate(result.rates);
                _this.convert(rate, $('#baseInput').val());
            });

            $('#baseInput').on('keyup input', function() {
                _this.convert(rate, $(this).val());
            });
        });

        return _this;
    },
    defaults: {
        appId: null,
        currencies: null
    },
    writeOptions: function(){
        var _this = this;
        $.ajax({
            url: 'https://openexchangerates.org/api/currencies.json',
            type: 'GET',
            dataType: 'jsonP',
        })
        .done(function(result) {
            var frag = '';

            $.each(result, function(abbr, fullName) {
                if (_this.settings.currencies !== null) {
                    if (_this.settings.currencies.indexOf(abbr) > -1) {
                        frag += "<option value='" + abbr + "'>" + fullName + "</option>";
                    }
                } else {
                    frag += "<option value='" + abbr + "'>" + fullName + "</option>";    
                }
            });

            _this.$elem.find('select').append(frag);
            $('#targetList').find('option[value=USD]').attr('selected', 'selected');
            $('#baseList').find('option[value=AUD]').attr('selected', 'selected');
        })
        .fail(function() {
            _this.$elem.append("<em class='me-warns'>Something went wrong! Sorry we can't help you now, please coming back later</em>");
        }); 
    },
    _makeRequest: function(id) {
        var _this = this,
            promise = $.Deferred();
        $.ajax({
            url: 'https://openexchangerates.org/api/latest.json?app_id=' + id,
            dataType: 'jsonp',
            success: function(result){
                promise.resolve(result);
            },
            error: function(){
                _this.$elem.append("<em class='me-warns'>Something went wrong! Sorry we can't help you now, please coming back later</em>");
            }
        });
        return promise;
    },
    displayInfo: function(data) {
        var frag = '',
            latestUpdate = new Date(data.timestamp * 1000);
        frag += "<div class='col-md-12 currency-info'><h4>Latest Update: <span>" + latestUpdate + "</span></h4>" +
             "<p><strong>Disclaimer:</strong> " + data.disclaimer + "</p>" + 
             "<p><strong>License:</strong> " + data.license + "</p></div>";
        this.$elem.append(frag);
    },
    getRate: function(rateLists) {
        var rate,
            baseSelected,
            targetSelected,
            baseRate,
            targetRate;

        baseSelected = $('#baseList').val();
        targetSelected = $('#targetList').val();

        $.each(rateLists, function(abbr, rate){
            if (abbr === baseSelected) {
                baseRate = rate;
            }
            if (abbr === targetSelected) {
                targetRate = rate;
            }
        })

        rate = targetRate / baseRate;

        return rate;
    },
    convert: function(rate, input) {
        var output;

        output = rate * Number(input);

        $('#targetOutput').val(output.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"));

    }
};

if (typeof Object.create !== 'function') {
    Object.create = function(obj) {
        function F(){};
        F.prototype = obj;
        return new F();
    }
}

(function($, window, document, undefined){
    $.plugin = function(name, object) {
        $.fn[name] = function(options) {
            return this.each(function(){
                if (!$.data(this, name)) {
                    $.data(this, name, Object.create(object).init(this, options));
                }
            });
        };
    };
    $.plugin('bngMoney', CurrencyConverter);
})(jQuery, window, document)