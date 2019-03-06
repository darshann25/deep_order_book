FROM rabbitmq:3.8-rc

COPY ./rabbit/plugin.sh /
RUN chmod +755 /plugin.sh

RUN rabbitmq-plugins enable --offline rabbitmq_management

# extract "rabbitmqadmin" from inside the "rabbitmq_management-X.Y.Z.ez" plugin zipfile
# see https://github.com/docker-library/rabbitmq/issues/207
RUN set -eux; \
	erl -noinput -eval ' \
		{ ok, AdminBin } = zip:foldl(fun(FileInArchive, GetInfo, GetBin, Acc) -> \
			case Acc of \
				"" -> \
					case lists:suffix("/rabbitmqadmin", FileInArchive) of \
						true -> GetBin(); \
						false -> Acc \
					end; \
				_ -> Acc \
			end \
		end, "", init:get_plain_arguments()), \
		io:format("~s", [ AdminBin ]), \
		init:stop(). \
	' -- /plugins/rabbitmq_management-*.ez > /usr/local/bin/rabbitmqadmin; \
	[ -s /usr/local/bin/rabbitmqadmin ]; \
	chmod +x /usr/local/bin/rabbitmqadmin; \
	apt-get update; apt-get install -y --no-install-recommends python; rm -rf /var/lib/apt/lists/*; \
	rabbitmqadmin --version


RUN apt-get update && apt-get install -y curl
RUN ./plugin.sh
# Enable the promethus exporter we just installed
RUN rabbitmq-plugins enable prometheus_rabbitmq_exporter

# RUN rabbitmqctl eval 'application:get_env(rabbit, plugins_dir).'


EXPOSE 15671 15672
