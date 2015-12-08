var CurrencyConverter = {
    init: function(elem, options) {
        var self = this;
        self.elem = elem;
        self.$elem = $(elem);

        self.settings = $.extend({}, self.defaults, options);

        self.writeOptions();

        if (self.settings.appId !== null && typeof self.settings.appId === 'string') {
            self.promiseObj = self._makeRequest(self.settings.appId);
        } else {
            self.$elem.append("<em class='me-warns'>Missing App Id - Please provide your Open Exchange Rates App Id</em>")
        }

        self.promiseObj.done(function(result){
            var rate, output;

            rate = self.getRate(result.rates);

            self.displayInfo(result);

            self.$elem.on('change', 'select', function() {
                rate = self.getRate(result.rates);
                self.convert(rate, $('#baseInput').val());
            });

            $('#baseInput').on('keyup input', function() {
                self.convert(rate, $(this).val());
            });
        });


        return self;
    },
    defaults: {
        appId: null,
        currencies: null
    },
    writeOptions: function(){
        var self = this;
        $.ajax({
            url: 'https://openexchangerates.org/api/currencies.json',
            type: 'GET',
            dataType: 'jsonP',
        })
        .done(function(result) {
            var frag = '';

            $.each(result, function(abbr, fullName) {
                if (self.settings.currencies !== null) {
                    if (self.settings.currencies.indexOf(abbr) > -1) {
                        frag += "<option value='" + abbr + "'>" + fullName + "</option>";
                    }
                } else {
                    frag += "<option value='" + abbr + "'>" + fullName + "</option>";    
                }
            });

            self.$elem.find('select').append(frag);
            $('#targetList').find('option[value=USD]').attr('selected', 'selected');
            $('#baseList').find('option[value=AUD]').attr('selected', 'selected');
        })
        .fail(function() {
            self.$elem.append("<em class='me-warns'>Something went wrong! Sorry we can't help you now, please coming back later</em>");
        }); 
    },
    _makeRequest: function(id) {
        var self = this,
            promise = $.Deferred();
        $.ajax({
            url: 'https://openexchangerates.org/api/latest.json?app_id=' + id,
            dataType: 'jsonp',
            success: function(result){
                promise.resolve(result);
            },
            error: function(result){
                self.$elem.append("<em class='me-warns'>Something went wrong! Sorry we can't help you now, please coming back later</em>");
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