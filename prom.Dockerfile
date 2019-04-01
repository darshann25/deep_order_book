FROM prom/prometheus

EXPOSE 9090:9090

ADD ./prom/prometheus.yml /etc/prometheus/prometheus.yml